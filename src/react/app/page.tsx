"use client"

import { AuthFrame } from "./AuthFrame"
import { UploadControl } from "./UploadControl"

export default function Home() {
	return (
		<AuthFrame description="Upload meow audio and see if Meowlin can identify the breed. (Results are mocked for this demo.)">
			<UploadControl />
		</AuthFrame>
	)
}
