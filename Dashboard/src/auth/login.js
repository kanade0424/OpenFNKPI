function getElement(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Element #${id} not found`);
    return el;
}
function validateUserId(value) {
    if (value.trim() === '') {
        return { valid: false, message: 'ユーザーIDを入力してください。' };
    }
    if (value.trim().length < 2) {
        return { valid: false, message: 'ユーザーIDは2文字以上で入力してください。' };
    }
    return { valid: true, message: '' };
}
function validatePassword(value) {
    if (value === '') {
        return { valid: false, message: 'パスワードを入力してください。' };
    }
    if (value.length < 4) {
        return { valid: false, message: 'パスワードは4文字以上で入力してください。' };
    }
    return { valid: true, message: '' };
}
function setFieldError(groupId, errorEl, message) {
    const group = document.getElementById(groupId);
    if (!group)
        return;
    if (message) {
        group.classList.add('has-error');
        errorEl.textContent = message;
    }
    else {
        group.classList.remove('has-error');
        errorEl.textContent = '';
    }
}
function setFormError(formError, formErrorText, message) {
    if (message) {
        formErrorText.textContent = message;
        formError.style.display = 'flex';
    }
    else {
        formErrorText.textContent = '';
        formError.style.display = 'none';
    }
}
function setLoading(elements, loading) {
    elements.btnLogin.disabled = loading;
    elements.btnText.style.display = loading ? 'none' : 'inline';
    elements.btnSpinner.style.display = loading ? 'inline-block' : 'none';
}
function initPasswordToggle(elements) {
    elements.togglePassword.addEventListener('click', () => {
        const isPassword = elements.password.type === 'password';
        elements.password.type = isPassword ? 'text' : 'password';
        elements.eyeOpen.style.display = isPassword ? 'none' : 'inline';
        elements.eyeClosed.style.display = isPassword ? 'inline' : 'none';
        elements.togglePassword.setAttribute('aria-label', isPassword ? 'パスワードを非表示' : 'パスワードを表示');
    });
}
function initRealtimeValidation(elements) {
    elements.userId.addEventListener('blur', () => {
        const result = validateUserId(elements.userId.value);
        setFieldError('group-userId', elements.errorUserId, result.message);
    });
    elements.userId.addEventListener('input', () => {
        if (elements.userId.closest('.form-group')?.classList.contains('has-error')) {
            const result = validateUserId(elements.userId.value);
            setFieldError('group-userId', elements.errorUserId, result.message);
        }
    });
    elements.password.addEventListener('blur', () => {
        const result = validatePassword(elements.password.value);
        setFieldError('group-password', elements.errorPassword, result.message);
    });
    elements.password.addEventListener('input', () => {
        if (elements.password.closest('.form-group')?.classList.contains('has-error')) {
            const result = validatePassword(elements.password.value);
            setFieldError('group-password', elements.errorPassword, result.message);
        }
    });
}
async function doLogin(userId, password) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    throw new Error('ユーザーIDまたはパスワードが正しくありません。');
}
function initFormSubmit(elements) {
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setFormError(elements.formError, elements.formErrorText, '');
        const userIdResult = validateUserId(elements.userId.value);
        const passwordResult = validatePassword(elements.password.value);
        setFieldError('group-userId', elements.errorUserId, userIdResult.message);
        setFieldError('group-password', elements.errorPassword, passwordResult.message);
        if (!userIdResult.valid || !passwordResult.valid) {
            return;
        }
        setLoading(elements, true);
        try {
            await doLogin(elements.userId.value.trim(), elements.password.value);
            window.location.href = '../index.html';
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'ログインに失敗しました。';
            setFormError(elements.formError, elements.formErrorText, message);
        }
        finally {
            setLoading(elements, false);
        }
    });
}
function animateCard(card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px) scale(0.97)';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}
function init() {
    const btnLogin = getElement('btnLogin');
    const togglePassword = getElement('togglePassword');
    const elements = {
        form: getElement('loginForm'),
        userId: getElement('userId'),
        password: getElement('password'),
        togglePassword,
        btnLogin,
        btnText: btnLogin.querySelector('.btn-text'),
        btnSpinner: btnLogin.querySelector('.btn-spinner'),
        formError: getElement('formError'),
        formErrorText: getElement('formErrorText'),
        errorUserId: getElement('error-userId'),
        errorPassword: getElement('error-password'),
        eyeOpen: togglePassword.querySelector('.eye-open'),
        eyeClosed: togglePassword.querySelector('.eye-closed'),
    };
    initPasswordToggle(elements);
    initRealtimeValidation(elements);
    initFormSubmit(elements);
    const card = getElement('loginCard');
    animateCard(card);
}
document.addEventListener('DOMContentLoaded', init);
