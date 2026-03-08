const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
const NUMBERS = "0123456789".split("");
const SYMBOLS = "~`!@#$%^&*()_-+={}[]|:;<>.?/".split("");

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    let passwordText1 = document.querySelector("#rectangle-el-1 .pass-text");
    let passwordText2 = document.querySelector("#rectangle-el-2 .pass-text");
    let generateBtn = document.getElementById("generate");
    let passwordLengthSlider = document.getElementById("password-length");
    let passwordLengthValue = document.getElementById("length-value");
    let includeNumbersCheckbox = document.getElementById("include-numbers");
    let includeSymbolsCheckbox = document.getElementById("include-symbols");
    let themeToggle = document.getElementById("theme-toggle");
    let copyButtons = document.querySelectorAll(".copy-btn");

    // initialize theme from localStorage (default to light)
    const body = document.body;
    const storedTheme = localStorage.getItem("theme");

    // initialize password length preference (clamp between 8 and 16)
    const storedLengthRaw = Number(localStorage.getItem("passwordLength")) || 15;
    const storedLength = Math.min(16, Math.max(8, storedLengthRaw));
    if (passwordLengthSlider) passwordLengthSlider.value = storedLength;
    if (passwordLengthValue) passwordLengthValue.textContent = storedLength;

    if (passwordLengthSlider) {
        passwordLengthSlider.addEventListener("input", () => {
            const length = Math.min(16, Math.max(8, Number(passwordLengthSlider.value)));
            if (passwordLengthValue) passwordLengthValue.textContent = length;
            localStorage.setItem("passwordLength", String(length));
        });
    }

    // initialize include-numbers/include-symbols preferences
    const storedNumbers = localStorage.getItem("includeNumbers") !== "false";
    const storedSymbols = localStorage.getItem("includeSymbols") !== "false";
    if (includeNumbersCheckbox) includeNumbersCheckbox.checked = storedNumbers;
    if (includeSymbolsCheckbox) includeSymbolsCheckbox.checked = storedSymbols;

    function getCharacterPool() {
        let pool = [...LETTERS];
        if (includeNumbersCheckbox && includeNumbersCheckbox.checked) pool = pool.concat(NUMBERS);
        if (includeSymbolsCheckbox && includeSymbolsCheckbox.checked) pool = pool.concat(SYMBOLS);
        return pool;
    }

    if (includeNumbersCheckbox) {
        includeNumbersCheckbox.addEventListener("change", () => {
            localStorage.setItem("includeNumbers", String(includeNumbersCheckbox.checked));
        });
    }

    if (includeSymbolsCheckbox) {
        includeSymbolsCheckbox.addEventListener("change", () => {
            localStorage.setItem("includeSymbols", String(includeSymbolsCheckbox.checked));
        });
    }

    function updateThemeToggle(isDark) {
        if (!themeToggle) return;
        const icon = themeToggle.querySelector(".theme-toggle__icon");

        if (icon) icon.textContent = isDark ? "☀️" : "🌙";

        themeToggle.setAttribute("aria-pressed", String(isDark));
        themeToggle.classList.toggle("is-dark", isDark);
    }

    if (storedTheme === "dark") {
        body.classList.add("theme-dark");
        updateThemeToggle(true);
    } else {
        updateThemeToggle(false);
    }

    function getRandomCharacter(pool) {
        let randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    }

    function calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length bonus
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        if (password.length >= 16) strength += 1;
        
        // Character variety bonuses
        if (/[a-z]/.test(password)) strength += 1; // lowercase
        if (/[A-Z]/.test(password)) strength += 1; // uppercase
        if (/[0-9]/.test(password)) strength += 1; // numbers
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1; // symbols
        
        // Normalize to 0-3 scale
        if (strength <= 3) return { level: 'weak', text: 'Weak', score: strength };
        if (strength <= 5) return { level: 'medium', text: 'Medium', score: strength };
        return { level: 'strong', text: 'Strong', score: strength };
    }

    function updateStrengthIndicator(password, container) {
        const strengthBar = container.querySelector('.strength-bar');
        const strengthText = container.querySelector('.strength-text');
        
        if (!password) {
            strengthBar.className = 'strength-bar';
            strengthText.textContent = '';
            return;
        }
        
        const strength = calculatePasswordStrength(password);
        strengthBar.className = `strength-bar ${strength.level}`;
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.level === 'weak' ? 'var(--error)' : 
                                   strength.level === 'medium' ? 'var(--warning)' : 
                                   'var(--success)';
    }

    function generatePassword() {
        const length = passwordLengthSlider ? Number(passwordLengthSlider.value) : 15;
        const pool = getCharacterPool();

        if (!pool.length) {
            // fallback to letters if everything is turned off
            pool.push(...LETTERS);
        }

        let password1 = "";
        let password2 = "";
        for (let i = 0; i < length; i++) {
            password1 += getRandomCharacter(pool);
            password2 += getRandomCharacter(pool);
        }
        
        // Update password displays
        if (passwordText1) {
            passwordText1.textContent = password1;
            const container1 = passwordText1.closest('.pass-box');
            updateStrengthIndicator(password1, container1);
        }
        if (passwordText2) {
            passwordText2.textContent = password2;
            const container2 = passwordText2.closest('.pass-box');
            updateStrengthIndicator(password2, container2);
        }
    }

    function copyPassword(text, button) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const original = button.textContent;
            button.textContent = "✓ Copied!";
            button.style.background = 'var(--success)';
            button.disabled = true;
            
            // Create toast notification
            showToast('Password copied to clipboard!');
            
            setTimeout(() => {
                button.textContent = original;
                button.style.background = '';
                button.disabled = false;
            }, 2000);
        }).catch(() => {
            showToast('Failed to copy password', 'error');
        });
    }

    function showToast(message, type = 'success') {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
            color: white;
            padding: 12px 20px;
            border-radius: var(--border-radius);
            font-weight: 500;
            font-size: 0.9rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transform: translateY(100px);
            opacity: 0;
            transition: var(--transition);
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // copy buttons
    copyButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const container = btn.closest(".pass-box");
            const textEl = container ? container.querySelector(".pass-text") : null;
            const text = textEl ? textEl.textContent.trim() : "";
            copyPassword(text, btn);
        });
    });

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const isDark = body.classList.toggle("theme-dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            updateThemeToggle(isDark);
        });
    }

    // Generate button
    if (generateBtn) {
        generateBtn.addEventListener("click", generatePassword);
    }
});

