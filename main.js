// Visit counter disabled 2026-10-23.
//
// This legacy static page previously fetched GetResumeCounter with the Azure
// Function access key embedded in the request URL. That published a privileged
// credential to every visitor and to this public repository, so the call and
// the key were removed outright rather than relocated into another public
// bundle or query string.
//
// The endpoint is declared AuthorizationLevel.Function in api/GetResumeCounter.cs
// and no anonymous equivalent exists, so there is nothing safe for browser code
// to call here. Removing the key from source is NOT revocation: the old value
// stays valid until a separately approved server-side rotation.
// See site/PUBLIC-CREDENTIAL-CLEANUP.md.
//
// For local development, run the function host and point a local-only constant
// at http://localhost:7071/api/GetResumeCounter. Never commit a deployed key.
