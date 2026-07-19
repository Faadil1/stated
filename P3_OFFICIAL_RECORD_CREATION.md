# P3: Create Official Live Record — Manual Steps

**Status:** ⏸️ BLOCKER (requires wallet interaction)  
**Objective:** Create a real STATED record that will be used in the landing hero and demo

---

## Why This Can't Be Automated

Wallet signing and transaction approval require:
- MetaMask wallet UI interaction (security feature)
- User approval of transaction details
- Gas payment confirmation on Monad testnet

These steps must be done manually by a user with wallet access.

---

## Step-by-Step: Create the Official Record

### 1. Prerequisites
- [ ] MetaMask installed in browser
- [ ] MetaMask connected to Monad testnet
- [ ] Testnet wallet has ETH for gas (~0.1 ETH should be plenty)

### 2. Navigate to App
```
http://localhost:3000
OR
https://stated-six.vercel.app (production)
```

### 3. Click "STATE YOUR OWN"
- Button appears on landing page
- This triggers wallet connection flow
- Approve connection in MetaMask

### 4. Create Record (Flow: Create → AttachEvidence → Receipt)

**Record Details:**

| Field | Value |
|-------|-------|
| Project Title | Build STATED |
| Project Promise | A tool that makes the gap between promises and delivery impossible to hide. |
| Deadline | 2026-07-21 |
| Condition 1 | Smart contract deployed on Monad |
| Condition 2 | Declaration anchored immutably on-chain |
| Condition 3 | Evidence attachment mechanism working |
| Condition 4 | Gap revealed on public receipt |
| Condition 5 | Judge remembers it three hours later |
| Condition 6 | Interface teaches the model in <5 seconds |

### 5. Submit Declaration
- Click "ANCHOR THIS DECLARATION"
- This sends the record to the smart contract
- MetaMask will prompt for transaction approval
- **Wait for transaction to confirm** (30-60 seconds)
- Record ID will be assigned by contract

### 6. Capture Record ID
- After transaction confirms, you'll see a success page
- **Record ID will be displayed** (e.g., "Record #7")
- Note this number

### 7. Attach Evidence (Recommended)
- Click "ATTACH EVIDENCE"
- Add 2-3 meaningful links:
  - GitHub repo: `https://github.com/yourusername/stated`
  - Deployed app: `https://stated-six.vercel.app`
  - This page: `https://github.com/yourusername/stated/blob/main/P3_OFFICIAL_RECORD_CREATION.md`
- Upload/link evidence for each condition (conditions 1-4 recommended)
- Submit evidence

### 8. Get Public Receipt URL
- Navigate to public receipt: `https://stated-six.vercel.app/receipt/{recordId}`
- This is the URL to share (walletless access)
- This is what judges will see

---

## What Happens After P3

1. **Record ID:** Used to update landing hero preview data
2. **Receipt URL:** Used for screenshot captures (P4)
3. **Demo video:** Will show the gap reveal on this real record (P5)

---

## Expected Result

A real on-chain record where:
- **What was stated:** Clear conditions before building
- **What was shown:** Evidence attached after
- **The gap:** Some conditions unaccounted for (if you don't attach evidence for all)
- **The seal:** Registry metadata showing timestamp, blockchain proof

This real record is the hero of the landing page and the core moment of the demo.

---

## If Something Goes Wrong

**Transaction failed/rejected:**
- Check wallet balance
- Ensure Monad testnet is selected
- Try again

**Can't connect wallet:**
- Ensure MetaMask is installed
- Ensure you're on the correct URL
- Check browser console for errors

**No record ID after transaction:**
- Check wallet transaction history
- Verify transaction was confirmed
- Try reloading the page

---

## Timeline

- ⏱️ **Time estimate:** 5-10 minutes
- 🔐 **Transaction time:** 30-60 seconds
- 📍 **Blockers:** Testnet ETH balance, MetaMask connection

Once complete, signal the record ID and we'll proceed to P4 (screenshots) and P5 (demo recording).
