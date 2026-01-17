# Publishing xR2 Make.com SDK

## Prerequisites

Before publishing, ensure:
- [ ] All modules are tested with real API key
- [ ] Connection test passes
- [ ] All JSON files are up to date
- [ ] Version in `app.json` is incremented

---

## Step 1: Create/Update Custom App on Make.com

1. Go to **https://eu2.make.com/apps**
2. Click **Create a new app** (or select existing "xR2" app)
3. Fill in app details:
   - **Name**: `xr2`
   - **Label**: `xR2 - Prompt Management`
   - **Description**: `AI prompt management platform: versioning, A/B testing, analytics. Get prompts from xR2 and track usage events.`

---

## Step 2: Configure Base

1. Go to **Base** section
2. Copy content from `base.json`:

```json
{
    "baseUrl": "https://xr2.uk/api/v1",
    "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    "log": {
        "sanitize": ["request.headers.authorization"]
    },
    "response": {
        "error": {
            "message": "{{body.detail.message}}",
            "type": "{{body.detail.error}}"
        }
    }
}
```

3. Save

---

## Step 3: Configure Connection

1. Go to **Connections** -> **Add**
2. Copy content from `connections/xr2_api_key.json`
3. Save
4. **Test**: Enter a valid API key and verify "Connection successful"

---

## Step 4: Add Modules

Add each module from `modules/` directory:

### 4.1 Check API Key
1. **Modules** -> **Add**
2. Copy content from `modules/checkApiKey.json`
3. Save

### 4.2 Get Prompt
1. **Modules** -> **Add**
2. Copy content from `modules/getPrompt.json`
3. Save

### 4.3 Track Event
1. **Modules** -> **Add**
2. Copy content from `modules/trackEvent.json`
3. Save

---

## Step 5: Test All Modules

Create a test scenario:

```
[Manual Trigger] -> [xR2: Check API Key] -> [xR2: Get Prompt] -> [xR2: Track Event]
```

1. Run **Check API Key** - should return `{"ok": true, "user": "..."}`
2. Run **Get Prompt** with valid slug - should return prompt data with trace_id
3. Run **Track Event** with trace_id from step 2 - should return event_id

---

## Step 6: Submit for Marketplace Review (Optional)

If you want to publish to Make.com Marketplace:

### 6.1 Prepare Required Information

- **Support Email**: hello@xr2.uk
- **Documentation URL**: https://xr2.gitbook.io/docs
- **Privacy Policy URL**: https://xr2.uk/privacy
- **Terms of Service URL**: https://xr2.uk/terms
- **App Icon**: 512x512px PNG (use xR2 logo)

### 6.2 Submit for Review

1. In your app settings, click **Submit for Review**
2. Fill in all required fields
3. Describe use cases and features
4. Submit

### 6.3 Wait for Approval

- Review typically takes 3-7 business days
- Make.com team may request changes
- Once approved, app appears at: `https://www.make.com/en/integrations/xr2`

---

## Updating Published App

When you need to update:

1. Make changes in JSON files
2. Increment version in `app.json`:
   - Bugfix: `1.1.0` -> `1.1.1`
   - New feature: `1.1.0` -> `1.2.0`
   - Breaking change: `1.1.0` -> `2.0.0`
3. Update modules in Make.com UI
4. If published to Marketplace: Submit for Review again

---

## Checklist Before Publishing

### Technical
- [ ] `base.json` is configured correctly
- [ ] Connection test passes with valid API key
- [ ] All 3 modules work (Check API Key, Get Prompt, Track Event)
- [ ] `source_name` is hardcoded as `make_sdk`
- [ ] Error handling works (test with invalid slug)

### Documentation
- [ ] README.md is up to date
- [ ] QUICK_START.md has clear instructions
- [ ] Example scenarios are documented

### Marketplace (if submitting)
- [ ] App icon uploaded (512x512px)
- [ ] Support email is valid
- [ ] Documentation URL works
- [ ] Privacy policy URL works
- [ ] Description is clear and professional

---

## Troubleshooting

### Module not visible after adding
- Refresh the page
- Check for JSON syntax errors in module definition

### Connection test fails
- Verify API key is valid at https://xr2.uk/api-keys
- Check Authorization header: `Bearer {{parameters.apiKey}}`

### Module returns empty response
- Verify `"response": { "output": "{{body}}" }` is set in communication block

---

## Support

- Make.com Developer Docs: https://developers.make.com/custom-apps-documentation
- xR2 Support: hello@xr2.uk
