import json
import logging
import os
import random
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CLIPS_TABLE_NAME = os.environ.get("CLIPS_TABLE_NAME")

RESULTS = [
    {"breed": "Siamese", "confidence": 0.92},
    {"breed": "Maine Coon", "confidence": 0.81},
    {"breed": "American Shorthair", "confidence": 0.76},
]

NO_RESULT = {"breed": None, "confidence": None}

_dynamodb = boto3.resource("dynamodb")
_table = None


def get_table():
    global _table
    if _table is None:
        if not CLIPS_TABLE_NAME:
            raise RuntimeError("CLIPS_TABLE_NAME environment variable is not set")
        _table = _dynamodb.Table(CLIPS_TABLE_NAME)
    return _table


def choose_mock_result():
    return random.choice(RESULTS + [NO_RESULT])


def get_clip_record(clip_id):
    try:
        response = get_table().get_item(Key={"clipId": clip_id})
    except ClientError as exc:
        logger.error("DynamoDB get_item failed for clipId=%s: %s", clip_id, exc)
        raise

    return response.get("Item")


def update_clip_record(clip_id, clip_status, breed, confidence):
    set_parts = [
        "clipStatus = :status",
        "processedAt = :processedAt",
    ]
    expression_attributes = {
        ":status": clip_status,
        ":processedAt": datetime.now(timezone.utc).isoformat(),
    }
    remove_parts = []

    if breed is None:
        remove_parts.append("identifiedBreed")
    else:
        set_parts.append("identifiedBreed = :breed")
        expression_attributes[":breed"] = breed

    if confidence is None:
        remove_parts.append("confidenceScore")
    else:
        set_parts.append("confidenceScore = :confidence")
        expression_attributes[":confidence"] = Decimal(str(confidence))

    update_expression = "SET " + ", ".join(set_parts)
    if remove_parts:
        update_expression += " REMOVE " + ", ".join(remove_parts)

    try:
        response = get_table().update_item(
            Key={"clipId": clip_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attributes,
            ReturnValues="ALL_NEW",
        )
    except ClientError as exc:
        logger.error("DynamoDB update_item failed for clipId=%s: %s", clip_id, exc)
        raise

    return response.get("Attributes")


def extract_clip_id_from_s3_key(s3_key):
    if not s3_key:
        return None

    decoded_key = unquote_plus(s3_key)
    parts = decoded_key.split("/")
    if len(parts) >= 2 and parts[0] == "uploads":
        return parts[1]

    logger.error("Invalid S3 key format: %s", decoded_key)
    return None


def process_clip(clip_id):
    clip = get_clip_record(clip_id)
    if clip is None:
        logger.warning("Clip not found in DynamoDB, marking as FAILED: %s", clip_id)
        return update_clip_record(clip_id, "FAILED", None, None)

    get_table().update_item(
        Key={"clipId": clip_id},
        UpdateExpression="SET clipStatus = :status",
        ExpressionAttributeValues={":status": "PROCESSING"},
    )

    result = choose_mock_result()
    if result["breed"] is None:
        logger.info(
            "Mock processing completed with no identified breed for clipId=%s", clip_id
        )
        return update_clip_record(clip_id, "COMPLETE", None, None)

    logger.info(
        "Mock processing completed for clipId=%s: breed=%s confidence=%s",
        clip_id,
        result["breed"],
        result["confidence"],
    )
    return update_clip_record(
        clip_id, "COMPLETE", result["breed"], result["confidence"]
    )


def lambda_handler(event, context):
    logger.info("Received SQS event with %d record(s)", len(event.get("Records", [])))

    processed = 0
    for record in event.get("Records", []):
        body = record.get("body")
        try:
            message = json.loads(body)
        except (TypeError, json.JSONDecodeError):
            logger.error("Invalid SQS message body: %s", body)
            continue

        clip_id = None

        # Handle S3 event wrapped in SQS message
        if "Records" in message and len(message["Records"]) > 0:
            s3_event = message["Records"][0]
            if s3_event.get("eventSource") == "aws:s3":
                s3_key = s3_event.get("s3", {}).get("object", {}).get("key")
                clip_id = extract_clip_id_from_s3_key(s3_key)
                if not clip_id:
                    continue
            else:
                logger.error("Unknown event source: %s", s3_event.get("eventSource"))
                continue
        else:
            clip_id = message.get("clipId")
            if not clip_id:
                logger.error("Missing clipId in SQS message: %s", message)
                continue

        try:
            process_clip(clip_id)
            processed += 1
        except Exception:
            logger.exception("Failed processing clipId=%s", clip_id)

    return {
        "status": "processed",
        "processedRecords": processed,
    }
