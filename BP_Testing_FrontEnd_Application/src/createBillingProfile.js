export async function createBillingProfile(sessionId, accountId, accountName, sfAccId) {
    const billToAddress1 = document.getElementById('bill-to-address1').value;
    const billToCity = document.getElementById('bill-to-city').value;
    const billToState = document.getElementById('bill-to-state').value;
    const billToCountry = document.getElementById('bill-to-country').value;
    const billToZip = document.getElementById('bill-to-zip').value;
    const billToEmail = document.getElementById('bill-to-email').value;

    const response = await fetch('https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/BILLING_PROFILE', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                Id: '',
                AccountBalance: '0.00',
                AccountBalanceNumber: '0',
                AccountId: accountId,
                AchBankAcctType: 'Business Checking',
                Address1: billToAddress1,
                BillTo: 'Venkata Thota',
                BillingCycle: 'MONTHLY',
                BillingEntity: accountName,
                BillingMethod: 'MAIL',
                CalendarClosingMonth: 'January',
                CalendarClosingWeekday: 'Saturday',
                CalendarType: '4-5-4',
                City: billToCity,
                Country: billToCountry,
                CurrencyCode: 'USD',
                DisablePDFGenerationOnInvoiceClose: '0',
                DunningInterval: '21',
                Email: billToEmail,
                EventBasedBilling: '0',
                InvoiceApprovalFlag: '1',
                InvoiceDeliveryMethod: 'EMAIL',
                InvoiceTemplateId: '127',
                ManualCloseFlag: '1',
                MonthlyBillingDate: '31',
                PaymentTermDays: '31',
                QuarterlyBillingMonth: 'March, June, September, December',
                SemiAnnualBillingMonth: 'June, December',
                State: billToState,
                StatementApprovalFlag: '0',
                Status: 'ACTIVE',
                TimeZoneId: '351',
                WeeklyBillingDate: 'Monday - Sunday',
                YearlyBillingMonth: 'January',
                Zip: billToZip,
                nrBillType: 'Check',
                nrInvoiceEmail: billToEmail,
                nrSalesforceAccountId: sfAccId
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating billing profile');
    }
    return data.createResponse[0].Id;
}
