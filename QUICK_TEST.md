# Quick Test Instructions

## Test Accounts Created:

### Carer Account:
- **Email**: marcosisgaming@gmail.com  
- **Password**: (whatever you used)
- **Role**: Carer

### Dependant Account:
- **Email**: dependant@example.com
- **Password**: password123
- **Role**: Dependant

## Testing Steps:

### 1. Test as Carer:
1. Login with your carer account (marcosisgaming@gmail.com)
2. Try adding a medication - it should work now
3. The medication will be added for the linked dependant

### 2. Test as Dependant:
1. Login with: dependant@example.com / password123
2. You should see the medication added by the carer
3. Try taking a photo of the medication

### 3. Test Photo Review:
1. Login back as carer
2. Check the confirmations tab to see submitted photos

## If Still Getting Errors:

The issue might be that the CarerDashboard is still hardcoded to use dependant ID 1, but our dependant has ID 4.

Let me know if you're still getting "failed to load information" and I'll update the code to fix the hardcoded ID issue.