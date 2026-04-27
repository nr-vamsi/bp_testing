/** Toggle a product sub-options panel on/off and clear its checkboxes when hidden. */
function _toggleOptionsPanel(checkboxId, fieldsetId, optionName) {
    const checked = document.getElementById(checkboxId).checked;
    document.getElementById(fieldsetId).style.display = checked ? 'block' : 'none';
    if (!checked)
        document.querySelectorAll(`input[name="${optionName}"]`).forEach(o => (o.checked = false));
}

export function handleUserCheckboxChange()    { _toggleOptionsPanel('user-checkbox',    'user-options',    'user-option'); }
export function handleComputeCheckboxChange() { _toggleOptionsPanel('compute-checkbox', 'compute-options', 'compute-option'); }
export function handleQueriesCheckboxChange() { _toggleOptionsPanel('queries-checkbox', 'queries-options', 'queries-option'); }

/** Mirror Bill To address into Ship To when checkbox is ticked. */
export function handleSameAsBillToChange() {
    const sameAsBillTo = document.getElementById('same-as-bill-to');
    const fields = ['address1', 'city', 'state', 'country', 'zip', 'email'];
    const billTo = Object.fromEntries(fields.map(f => [f, document.getElementById(`bill-to-${f}`)]));
    const shipTo = Object.fromEntries(fields.map(f => [f, document.getElementById(`ship-to-${f}`)]));

    if (sameAsBillTo.checked) {
        fields.forEach(f => { shipTo[f].value = billTo[f].value; shipTo[f].disabled = true; });
    } else {
        fields.forEach(f => { shipTo[f].disabled = false; });
    }
}

/** Validates required fields before the Create flow begins. Alerts and returns false on failure. */
export function validateFieldValues() {
    const billingTermsSelect = document.getElementById('billing-terms');
    if (!billingTermsSelect?.value) {
        alert('Please select a value for Billing Terms before proceeding.');
        billingTermsSelect?.focus();
        return false;
    }
    const sessionIdInput = document.getElementById('session-id');
    if (!sessionIdInput?.value) {
        alert('Please enter a value for Session ID before proceeding.');
        sessionIdInput?.focus();
        return false;
    }
    return true;
}
