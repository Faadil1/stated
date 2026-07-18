# Vercel Preview Deployment Guide for STATED

**Target**: Vercel preview deployment  
**Status**: Ready for preview deployment (after Pinata setup)  
**Git Commit**: e0a4329 (latest with all fixes)

---

## Prerequisites

- Vercel CLI installed: `npm install -g vercel`
- Git repository initialized and committed
- Pinata API key (see Section: Pinata Setup)

---

## Step 1: Pinata API Key Setup (Manual - Do Not Share in Chat)

### 1.1 Create Pinata Account
1. Go to https://www.pinata.cloud
2. Sign up or log in
3. Navigate to API Keys page

### 1.2 Create Scoped API Key
1. Click "Create Key"
2. Set permissions:
   - ✅ `pinning.pinFileToIPFS` (upload files)
   - ✅ `data.testAuth` (test connectivity)
   - ❌ Do NOT enable delete or admin permissions
3. Copy the JWT token
4. **KEEP THIS SECRET - DO NOT PASTE IN CHAT**

### 1.3 Store Key Safely (Local Testing Only)
```bash
# Create local .env file (NEVER COMMIT)
echo "PINATA_JWT=<paste-your-jwt-here>" > .env

# Verify it's ignored
grep ".env" .gitignore
# Should show: .env
```

---

## Step 2: Connect Vercel Project

### 2.1 Initialize Vercel Project
```bash
cd ~/stated
vercel login
# Opens browser to authenticate with Vercel
```

### 2.2 Create/Import Project
```bash
# First deployment
vercel --prod  # This will prompt you to create a project

# OR if already created:
vercel link
```

### 2.3 Add Environment Variable to Vercel
**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/dashboard
2. Select your project: "stated"
3. Go to Settings → Environment Variables
4. Add new variable:
   - Name: `PINATA_JWT`
   - Value: `<your-pinata-jwt>`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. Save

**Option B: Via Vercel CLI**
```bash
vercel env add PINATA_JWT
# Prompts: Enter value > <paste-jwt>
# Select environments to add to
```

---

## Step 3: Verify Project Structure

### 3.1 Confirm Files Exist
```bash
ls -la ~/stated/
# ✓ api/upload-manifest.js
# ✓ frontend/src/
# ✓ package.json (with dependencies)
# ✓ vercel.json
# ✓ hardhat.config.js

ls -la ~/stated/frontend/
# ✓ package.json
# ✓ src/
# ✓ dist/ (after build)
```

### 3.2 Verify Configurations
```bash
# Check Vercel config
cat vercel.json | jq .

# Check root dependencies
cat package.json | jq '.dependencies'

# Check frontend setup
cat frontend/package.json | jq '.scripts.build'
```

---

## Step 4: Pre-Deployment Local Build

### 4.1 Clean Build Test
```bash
cd ~/stated

# Clean
rm -rf node_modules frontend/node_modules frontend/dist

# Install
npm ci
npm ci --prefix frontend

# Build
npm ci --prefix frontend && vite build --prefix frontend
# OR
cd frontend && npm run build && cd ..

# Verify output
ls -lh frontend/dist/
# Should show: index.html, assets/index-*.js, assets/index-*.css
```

### 4.2 Verify No Secrets in Bundle
```bash
# Check built JavaScript for secrets
grep -i "pinata\|secret\|jwt" frontend/dist/assets/*.js
# Should return: (empty)

# Check for env variables
grep "VITE_" frontend/dist/assets/*.js | head -3
# Should only show: VITE_CONTRACT_ADDRESS, VITE_CHAIN_ID, VITE_API_URL
```

---

## Step 5: Preview Deployment

### 5.1 Deploy to Preview
```bash
cd ~/stated
vercel --prod=false  # Deploy to preview
# Output will show:
# Preview: https://stated-xyzabc.vercel.app
```

### 5.2 Verify Deployment
```bash
# Test API endpoint
curl -X POST https://stated-xyzabc.vercel.app/api/upload-manifest \
  -H "Content-Type: application/json" \
  -d '{"manifest": {"schema": "stated/declaration/v1", "project": {"title": "Test", "promise": "Build"}, "deadline": "2026-12-31T00:00:00Z", "conditions": [{"id": "c1", "text": "Done"}]}, "type": "declaration"}'

# Expected response (if Pinata JWT is set):
# {"uri": "ipfs://Qm...", "cid": "Qm...", "manifestHash": "0x...", "gatewayURL": "..."}

# Test SPA routing
curl https://stated-xyzabc.vercel.app/receipt/1
# Should return: index.html content (not 404)
```

---

## Step 6: Live Cross-Session Test

### 6.1 Create Declaration
1. Open: `https://stated-xyzabc.vercel.app`
2. Fill form:
   - Title: "Test Project"
   - Promise: "I will ship a feature"
   - Deadline: 2 weeks from now
   - Conditions: "Feature works", "Tests pass"
3. Submit
4. Note the Record ID from confirmation (e.g., ID = 1)

### 6.2 Attach Evidence
1. Add evidence items:
   - "GitHub" → link to repository
   - "PR" → link to PR
2. Link to conditions
3. Submit
4. Verify integrity check passes

### 6.3 Cross-Session Test
1. Copy receipt URL: `https://stated-xyzabc.vercel.app/receipt/1`
2. Open **new incognito window**
3. Paste URL
4. Verify:
   - ✅ Declaration loads from IPFS
   - ✅ Evidence loads from IPFS
   - ✅ Integrity shows "MATCH"
   - ✅ Conditions display
   - ✅ No localStorage read (DevTools Network tab)

### 6.4 Success Criteria
- [x] API responds to manifest upload
- [x] Manifest appears on IPFS gateway
- [x] Receipt loads in fresh incognito session
- [x] Hashes verify (integrity match)
- [x] No errors in Vercel logs

---

## Step 7: Troubleshooting

### Issue: "PINATA_JWT is undefined"
**Cause**: Environment variable not set in Vercel  
**Fix**:
```bash
# Check if variable was added
vercel env list

# If missing, add it
vercel env add PINATA_JWT

# Redeploy
vercel --prod=false
```

### Issue: "POST /api/upload-manifest returns 500"
**Check logs**:
```bash
# View deployment logs
vercel logs <deployment-url>

# Look for "canonicalize is not a function"
# This means the import fix didn't deploy correctly
# Redeploy with: git push
```

### Issue: "Frontend build fails"
**Check**:
```bash
# Test build locally
cd frontend
npm ci
npm run build

# If successful locally but fails on Vercel:
# - Check vercel.json buildCommand
# - Verify package.json scripts exist
# - Check for missing dependencies
```

### Issue: "Cross-session test: receipt not loading"
**Diagnose**:
1. Check if declaration/evidence UIs on IPFS:
   ```bash
   curl https://ipfs.io/ipfs/<cid>
   ```
2. If CID doesn't resolve: Pinata upload failed
3. Check Vercel logs for upload errors

---

## Deployment Checklist

- [ ] Pinata API key created (scoped permissions)
- [ ] Vercel project created
- [ ] PINATA_JWT added to Vercel environment
- [ ] Local build succeeds
- [ ] No secrets in frontend bundle
- [ ] Git repository clean and committed
- [ ] vercel.json has correct configuration
- [ ] package.json has dependencies section
- [ ] API endpoint tested and responds
- [ ] SPA routing tested (404 → index.html)
- [ ] Cross-session receipt test passed
- [ ] Vercel logs show no errors

---

## Exact Vercel Settings

**Project Name**: stated  
**Framework**: Vite (React)  
**Node Version**: 24.x  
**Build Command**: `npm install && npm ci --prefix frontend`  
**Output Directory**: `frontend/dist`  
**Install Command**: `npm ci`  

**Environment Variables**:
```
PINATA_JWT=<scoped-api-key>
```

**Rewrite Rules** (from vercel.json):
```json
"rewrites": [
  { "source": "/api/:path*", "destination": "/api/:path*" },
  { "source": "/:path*", "destination": "/index.html" }
]
```

---

## Rollback Process

If deployment breaks:

1. **Identify problem**:
   ```bash
   vercel logs <url>
   ```

2. **Fix locally**:
   ```bash
   git fix && git commit && git push
   ```

3. **Redeploy**:
   ```bash
   vercel --prod=false
   ```

4. **Or revert**:
   ```bash
   git revert HEAD
   git push
   vercel --prod=false
   ```

---

## Security Reminders

- ❌ Never paste PINATA_JWT in chat or commit messages
- ❌ Never add PINATA_JWT to .env in repository
- ❌ Never create VITE_PINATA_JWT variable
- ✅ Pinata JWT exists only in Vercel environment
- ✅ Rotate JWT if exposed
- ✅ Use scoped API keys (permissions limited)

---

## Next Steps After Preview Passes

If cross-session test passes:

1. **Test production deployment**:
   ```bash
   vercel --prod
   ```

2. **Update production URL** in documentation

3. **Repeat cross-session test** on production URL

4. **Monitor metrics**:
   - Vercel function invocations
   - Pinata upload success rate
   - Error rates

---

**Deployment Ready**: Yes (after Pinata setup)  
**Last Updated**: 2026-07-18  
**Commit**: e0a4329
