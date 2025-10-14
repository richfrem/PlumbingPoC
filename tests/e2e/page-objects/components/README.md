# E2E Component Page Objects

This directory contains Component-level Page Objects that handle specific UI components within larger page contexts. These are smaller, focused utilities for reusable UI elements.

## 📋 **Component Mappings**

### **CommunicationLog.ts**
**Frontend Component:** Communication Log sections in request detail modals
**Purpose:** Message threads, notes, and communication history management

**Usage:**
```typescript
const commLog = new CommunicationLog(page);
await commLog.addNote('Customer called, requested rush service');
await commLog.verifyMessageExists('Quote sent via email');
```

---

### **AttachmentSection.ts**
**Frontend Component:** File attachment sections in request detail modals
**Purpose:** File uploads, downloads, and attachment management

**Usage:**
```typescript
const attachments = new AttachmentSection(page);
await attachments.uploadFile('/path/to/leak-photo.jpg');
await attachments.verifyAttachmentExists('leak-photo.jpg');
```

---

### **QuoteList.ts**
**Frontend Component:** Quote display and management sections
**Purpose:** Quote acceptance, rejection, and quote information display

**Usage:**
```typescript
const quoteList = new QuoteList(page);
await quoteList.acceptQuote('quote-123');
await quoteList.verifyQuotePricing('quote-123', '$504.00');
```

---

### **ServiceLocationManager.ts**
**Frontend Component:** Address forms and location management
**Purpose:** Address input, geocoding, and location validation

**Usage:**
```typescript
const locationMgr = new ServiceLocationManager(page);
await locationMgr.fillAddressForm({
  useProfileAddress: false,
  address: '123 Main St',
  city: 'Vancouver',
  postalCode: 'V6B 1A1'
});
await locationMgr.verifyAddressGeocoding();
```

---

### **CommandMenu.ts**
**Frontend Component:** User dropdown menu in header
**Purpose:** User account actions, navigation, and sign out functionality

**Usage:**
```typescript
const commandMenu = new CommandMenu(page);
await commandMenu.openMenu();
await commandMenu.navigateToCommandCenter();
await commandMenu.signOut();
```

---

### **AITriageSummary.ts**
**Frontend Component:** AI analysis and triage recommendation displays
**Purpose:** AI-powered request analysis and priority recommendations

**Usage:**
```typescript
const aiTriage = new AITriageSummary(page);
await aiTriage.triggerAITriage();
await aiTriage.verifyTriageSummary({ priority: 'high' });
```

## 🏗️ **Architecture Notes**

### **Component vs Page Objects:**
- **Components**: Handle specific UI widgets/elements within pages
- **Pages**: Handle complete page workflows and layouts

### **Usage Patterns:**
```typescript
// Page Object uses Component Objects
export class RequestDetailPage extends BasePage {
  private commLog = new CommunicationLog(this.page);
  private attachments = new AttachmentSection(this.page);

  async addNoteAndAttachment(note: string, filePath: string) {
    await this.commLog.addNote(note);
    await this.attachments.uploadFile(filePath);
  }
}
```

### **Testing Strategy:**
- Components are tested indirectly through Page Objects
- Direct component testing only for complex component-specific logic
- Components focus on UI interactions, not business logic

## 📚 **Related Documentation**

- `../pages/README.md` - Page-level object mappings
- `../base/BasePage.ts` - Common functionality
- `../../../utils/` - Global utilities
