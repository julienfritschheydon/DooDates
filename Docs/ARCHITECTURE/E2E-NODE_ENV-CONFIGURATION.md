# NODE_ENV Configuration for E2E Tests

## 🚨 CRITICAL: Do not change NODE_ENV in E2E server

### **Why NODE_ENV=development is REQUIRED for E2E tests**

#### **The Problem (Historical Context)**

- **Date**: January 2026
- **Issue**: E2E tests worked locally but failed in CI
- **Root Cause**: Environment variable conflict between CI and E2E server

#### **Environment Variables Conflict**

| Environment         | CI Workflow         | E2E Server           | Result              |
| ------------------- | ------------------- | -------------------- | ------------------- |
| **Local**           | NODE_ENV=undefined  | NODE_ENV=development | ✅ Full React UI    |
| **CI (Before Fix)** | NODE_ENV=production | NODE_ENV=test        | ❌ Minimal React UI |
| **CI (After Fix)**  | NODE_ENV=production | NODE_ENV=development | ✅ Full React UI    |

#### **Technical Explanation**

```javascript
// CI Workflow sets:
CI=true NODE_ENV=production BASE_URL=http://localhost:8080/DooDates

// E2E Server overrides:
NODE_ENV: 'development'  // FORCED to ensure complete React UI
```

#### **What happens with different NODE_ENV values:**

**NODE_ENV=development** (REQUIRED):

- ✅ Full React interface with all components
- ✅ All `data-testid` elements are present
- ✅ Chat input, forms, buttons are rendered
- ✅ E2E tests can find and interact with elements

**NODE_ENV=production**:

- ⚠️ Optimized React build
- ⚠️ Some development-only features may be missing
- ⚠️ `data-testid` elements might be stripped

**NODE_ENV=test**:

- ❌ Minimal React interface
- ❌ NO `data-testid` elements (0 found)
- ❌ Chat input missing
- ❌ E2E tests fail completely

### **Files Involved**

#### **Primary Configuration**

```javascript
// scripts/start-e2e-server.cjs - Line 96
NODE_ENV: 'development',  // DO NOT CHANGE - See documentation
```

#### **CI Workflow**

```yaml
# .github/workflows/13-preprod-to-main.yml
CI=true NODE_ENV=production BASE_URL=http://localhost:8080/DooDates
```

### **Warning Signs of Regression**

If you see these errors in CI, NODE_ENV might be wrong:

```
📊 Nombre total d'éléments avec data-testid: 0
📊 Chat input [data-testid="chat-input"]: Count: 0, Visible: false
📊 Inputs trouvés: 0, Textareas trouvés: 0
```

### **Testing the Configuration**

#### **Debug Test**

Run the CI debug test to verify NODE_ENV is correct:

```bash
npx playwright test tests/e2e/ci-debug-chat-input.spec.ts --project=chromium
```

**Expected Results:**

```
📊 Nombre total d'éléments avec data-testid: 7
📊 Chat input [data-testid="chat-input"]: Count: 1, Visible: true
📊 Inputs trouvés: 3, Textareas trouvés: 1
```

### **Migration Guide**

If you absolutely MUST change NODE_ENV:

1. **Update all E2E tests** to work with minimal UI
2. **Remove all `data-testid` dependencies**
3. **Use alternative selectors** (CSS classes, roles, etc.)
4. **Update CI debug test** expectations
5. **Test thoroughly** in both local and CI

### **Conclusion**

**NODE_ENV=development in E2E server is NON-NEGOTIABLE** for current test architecture.

Changing it will break ALL E2E tests in CI.

**Last Updated**: January 2026  
**Issue**: E2E tests failing in CI due to missing React elements  
**Solution**: Force NODE_ENV=development in E2E server
