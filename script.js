const passwordInput = document.getElementById('password');
const feedback = document.getElementById('feedback');
const meter = document.getElementById('strengthMeter');
const togglePassword = document.getElementById('togglePassword');

passwordInput.addEventListener('input', async () => {
    const password = passwordInput.value;

    const strength = getPasswordStrength(password);
    const entropy = calculateEntropy(password);
    const suggestions = getSuggestions(password);
    const isPwned = await checkPwned(password);

    meter.value = mapStrengthToMeter(strength);
    updateMeterColor(strength);

    feedback.innerHTML = `
        <strong>Strength:</strong> ${strength}<br>
        <strong>Entropy:</strong> ${entropy} bits<br>
        ${isPwned ? "<span style='color: red;'>⚠️ This password was found in a breach!</span><br>" : ""}
        ${suggestions.length > 0 ? "<strong>Suggestions:</strong><ul>" + suggestions.map(s => `<li>${s}</li>`).join('') + "</ul>" : ""}
    `;
});

function getPasswordStrength(password) {
    if (password.length < 6) return "too-short";
    let strength = 0;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[\W_]/.test(password)) strength++;

    switch (strength) {
        case 0:
        case 1:
            return "weak";
        case 2:
            return "moderate";
        case 3:
            return "strong";
        case 4:
            return "very-strong";
    }
}

function mapStrengthToMeter(strengthLabel) {
    switch (strengthLabel) {
        case "Too-short": return 0;
        case "weak": return 1;
        case "moderate": return 2;
        case "strong": return 3;
        case "very-strong": return 4;
        default: return 0;
    }
}

function updateMeterColor(strengthLabel) {
    meter.classList.remove('too-short', 'weak', 'moderate', 'strong', 'very-strong');
    meter.classList.add(strengthLabel);
}

function getSuggestions(password) {
    const suggestions = [];
    if (!/[a-z]/.test(password)) suggestions.push("Add lowercase letters");
    if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters");
    if (!/\d/.test(password)) suggestions.push("Add numbers");
    if (!/[\W_]/.test(password)) suggestions.push("Add special characters");
    if (password.length < 8) suggestions.push("Make it longer (8+ characters)");
    return suggestions;
}

async function checkPwned(password) {
    const sha1 = await sha1Hash(password);
    const prefix = sha1.slice(0, 5).toUpperCase();
    const suffix = sha1.slice(5).toUpperCase();
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await res.text();
    return text.includes(suffix);
}

async function sha1Hash(password) {
    const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function calculateEntropy(password) {
    let charset = 0;
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/\d/.test(password)) charset += 10;
    if (/[\W_]/.test(password)) charset += 32;

    const entropy = password.length * Math.log2(charset || 1); // Avoid log2(0)
    return entropy.toFixed(2);
}

togglePassword.addEventListener('change', () => {
    passwordInput.type = togglePassword.checked ? 'text' : 'password';
});
