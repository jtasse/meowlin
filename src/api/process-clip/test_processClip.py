import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

import processClip


class TestExtractClipIdFromS3Key:
    def test_parses_standard_upload_key(self):
        assert (
            processClip.extract_clip_id_from_s3_key(
                "uploads/abc-123/client-1.mp3"
            )
            == "abc-123"
        )

    def test_url_decodes_encoded_keys(self):
        assert (
            processClip.extract_clip_id_from_s3_key(
                "uploads/abc-123/client%201.mp3"
            )
            == "abc-123"
        )

    def test_returns_none_for_invalid_prefix(self):
        assert processClip.extract_clip_id_from_s3_key("other/path/file.mp3") is None

    def test_returns_none_for_empty_key(self):
        assert processClip.extract_clip_id_from_s3_key(None) is None


class TestUpdateClipRecord:
    @patch.object(processClip, "get_table")
    def test_removes_breed_fields_when_null(self, mock_get_table):
        table = MagicMock()
        mock_get_table.return_value = table
        table.update_item.return_value = {"Attributes": {"clipId": "c1"}}

        processClip.update_clip_record("c1", "COMPLETE", None, None)

        kwargs = table.update_item.call_args.kwargs
        assert "REMOVE identifiedBreed, confidenceScore" in kwargs["UpdateExpression"]
        assert ":breed" not in kwargs["ExpressionAttributeValues"]
        assert ":confidence" not in kwargs["ExpressionAttributeValues"]

    @patch.object(processClip, "get_table")
    def test_sets_breed_and_confidence_when_present(self, mock_get_table):
        table = MagicMock()
        mock_get_table.return_value = table
        table.update_item.return_value = {"Attributes": {"clipId": "c1"}}

        processClip.update_clip_record("c1", "COMPLETE", "Siamese", 0.92)

        values = table.update_item.call_args.kwargs["ExpressionAttributeValues"]
        assert values[":breed"] == "Siamese"
        assert values[":confidence"] == Decimal("0.92")
        assert "identifiedBreed = :breed" in table.update_item.call_args.kwargs[
            "UpdateExpression"
        ]


class TestProcessClip:
    @patch.object(processClip, "update_clip_record")
    @patch.object(processClip, "get_clip_record")
    def test_marks_missing_clip_as_failed(self, mock_get, mock_update):
        mock_get.return_value = None

        processClip.process_clip("missing-id")

        mock_update.assert_called_once_with("missing-id", "FAILED", None, None)

    @patch.object(processClip, "update_clip_record")
    @patch.object(processClip, "choose_mock_result")
    @patch.object(processClip, "get_clip_record")
    @patch.object(processClip, "get_table")
    def test_sets_processing_then_complete_with_breed(
        self, mock_get_table, mock_get, mock_choose, mock_update
    ):
        table = MagicMock()
        mock_get_table.return_value = table
        mock_get.return_value = {"clipId": "c1", "clipStatus": "PENDING_UPLOAD"}
        mock_choose.return_value = {"breed": "Maine Coon", "confidence": 0.81}

        processClip.process_clip("c1")

        table.update_item.assert_called_once()
        processing_values = table.update_item.call_args.kwargs[
            "ExpressionAttributeValues"
        ]
        assert processing_values[":status"] == "PROCESSING"
        mock_update.assert_called_once_with("c1", "COMPLETE", "Maine Coon", 0.81)

    @patch.object(processClip, "update_clip_record")
    @patch.object(processClip, "choose_mock_result")
    @patch.object(processClip, "get_clip_record")
    @patch.object(processClip, "get_table")
    def test_complete_with_no_breed_removes_fields(
        self, mock_get_table, mock_get, mock_choose, mock_update
    ):
        table = MagicMock()
        mock_get_table.return_value = table
        mock_get.return_value = {"clipId": "c1"}
        mock_choose.return_value = {"breed": None, "confidence": None}

        processClip.process_clip("c1")

        mock_update.assert_called_once_with("c1", "COMPLETE", None, None)


class TestLambdaHandler:
    @patch.object(processClip, "process_clip")
    def test_processes_s3_notification_wrapped_in_sqs(self, mock_process):
        s3_message = {
            "Records": [
                {
                    "eventSource": "aws:s3",
                    "s3": {"object": {"key": "uploads/clip-9/client-1.mp3"}},
                }
            ]
        }
        event = {
            "Records": [{"body": json.dumps(s3_message)}],
        }

        result = processClip.lambda_handler(event, None)

        mock_process.assert_called_once_with("clip-9")
        assert result["processedRecords"] == 1

    @patch.object(processClip, "process_clip")
    def test_processes_direct_clip_id_message(self, mock_process):
        event = {"Records": [{"body": json.dumps({"clipId": "direct-1"})}]}

        result = processClip.lambda_handler(event, None)

        mock_process.assert_called_once_with("direct-1")
        assert result["processedRecords"] == 1

    @patch.object(processClip, "process_clip")
    def test_skips_invalid_json_body(self, mock_process):
        event = {"Records": [{"body": "not-json"}]}

        result = processClip.lambda_handler(event, None)

        mock_process.assert_not_called()
        assert result["processedRecords"] == 0
