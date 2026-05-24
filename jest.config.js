/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "node",
	testMatch: ["**/src/api/**/*.test.js"],
	clearMocks: true,
	modulePathIgnorePatterns: [
		"<rootDir>/.aws-sam/",
		"<rootDir>/src/front-end/",
	],
}
