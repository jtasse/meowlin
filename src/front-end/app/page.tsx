"use client"

import { AuthFrame } from "./AuthFrame"
import { UploadControl } from "./UploadControl"

export default function Home() {
	return (
		<AuthFrame>
			<UploadControl />
		</AuthFrame>
	)
}
