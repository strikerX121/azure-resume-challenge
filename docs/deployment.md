# Deployment

## Azure resources

| Resource | Name |
|----------|------|
| Subscription | Azure-Resume-Challenge (ID: `9682ff58-8f3e-47f1-8a01-29897cc7ce13`) |
| Resource group | `Azure-Resume-Challenge` |
| Storage account | `azureresumefrontend1` |
| Storage container | `$web` |
| Front Door profile | `azureresumearc` |
| Front Door endpoint | `azureresumearc` |
| Functions app | `<function-app-name>` (deploy via `func azure functionapp publish`) |

## Full deploy (frontend)

Run from the `$web` directory:

```powershell
# 1. Build
npx astro build

# 2. Get storage key
$key = az storage account keys list `
  --account-name azureresumefrontend1 `
  --resource-group Azure-Resume-Challenge `
  --query "[0].value" -o tsv

$dist = "C:\Users\anton\Downloads\Updated Azure Resume\`$web\dist"

# 3a. Upload all files with no-cache (HTML, XML, PDF, etc.)
az storage blob upload-batch `
  --account-name azureresumefrontend1 --account-key $key `
  -s $dist -d '$web' --overwrite `
  --content-cache-control "no-cache, must-revalidate"

# 3b. Re-upload _astro/ with 1-year immutable cache (content-hashed assets)
az storage blob upload-batch `
  --account-name azureresumefrontend1 --account-key $key `
  -s "$dist\_astro" -d '$web/_astro' --overwrite `
  --content-cache-control "public, max-age=31536000, immutable"

# 3c. Re-upload images/ with 7-day cache
az storage blob upload-batch `
  --account-name azureresumefrontend1 --account-key $key `
  -s "$dist\images" -d '$web/images' --overwrite `
  --content-cache-control "public, max-age=604800"

# 4. Purge CDN cache
az afd endpoint purge `
  --resource-group Azure-Resume-Challenge `
  --profile-name azureresumearc `
  --endpoint-name azureresumearc `
  --content-paths "/*" `
  --domains "www.antoniocumberbatch.com"
```

## Quick redeploy (HTML/JS/CSS changes only — skips image re-upload)

```powershell
npx astro build

$key = az storage account keys list --account-name azureresumefrontend1 --resource-group Azure-Resume-Challenge --query "[0].value" -o tsv
$dist = "C:\Users\anton\Downloads\Updated Azure Resume\`$web\dist"

az storage blob upload-batch --account-name azureresumefrontend1 --account-key $key -s $dist -d '$web' --overwrite --content-cache-control "no-cache, must-revalidate"
az storage blob upload-batch --account-name azureresumefrontend1 --account-key $key -s "$dist\_astro" -d '$web/_astro' --overwrite --content-cache-control "public, max-age=31536000, immutable"

az afd endpoint purge --resource-group Azure-Resume-Challenge --profile-name azureresumearc --endpoint-name azureresumearc --content-paths "/*" --domains "www.antoniocumberbatch.com"
```

## Why `--account-key` instead of your login?

The Azure Storage data plane requires the `Storage Blob Data Contributor` role, which is separate from the `Owner` role on the subscription. Using `--account-key` bypasses RBAC and always works.

## Backend (Azure Functions — visit counter)

```powershell
cd api
func azure functionapp publish <function-app-name>
```

## Domain configuration

Both `www.antoniocumberbatch.com` and `antoniocumberbatch.com` are registered as custom domains in Azure Front Door. The apex domain redirects to www via a Rules Engine rule set (`ApexRedirect`).

DNS is managed in Squarespace (Google Cloud DNS nameservers). If you ever need to re-validate the apex domain in Front Door:

```powershell
# Get new validation token
az afd custom-domain show `
  --resource-group Azure-Resume-Challenge `
  --profile-name azureresumearc `
  --custom-domain-name antoniocumberbatch-com `
  --query "validationProperties"

# Add/update the _dnsauth TXT record in Squarespace with the new token
```

## Switching Azure accounts

The storage account is under `antonio.cumberbatch@hotmail.com`, default directory.

```powershell
az login
az account set --subscription "9682ff58-8f3e-47f1-8a01-29897cc7ce13"
```

## Sitemap

`public/sitemap.xml` is maintained manually. After adding a new page or blog post, add the URL there before deploying.

The live sitemap URL: `https://www.antoniocumberbatch.com/sitemap.xml`
