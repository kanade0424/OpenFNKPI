interface ValidationResult {
    valid: boolean;
    message: string;
}

interface LoginFormElements {
    form: HTMLFormElement;
    userId: HTMLInputElement;
    password: HTMLInputElement;
    togglePassword: HTMLButtonElement;
    btnLogin: HTMLButtonElement;
    btnText: HTMLSpanElement;
    btnSpinner: HTMLSpanElement;
    formError: HTMLDivElement;
    formErrorText: HTMLSpanElement;
    errorUserId: HTMLSpanElement;
    errorPassword: HTMLSpanElement;
    eyeOpen: Element;
    eyeClosed: Element;
}


function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el as T;
}

function validateUserId(value: string): ValidationResult {
    if (value.trim() === '') {
        return { valid: false, message: 'ユーザーIDを入力してください。' };
    }
    if (value.trim().length < 2) {
        return { valid: false, message: 'ユーザーIDは2文字以上で入力してください。' };
    }
    return { valid: true, message: '' };
}

function validatePassword(value: string): ValidationResult {
    if (value === '') {
        return { valid: false, message: 'パスワードを入力してください。' };
    }
    if (value.length < 4) {
        return { valid: false, message: 'パスワードは4文字以上で入力してください。' };
    }
    return { valid: true, message: '' };
}


function setFieldError(groupId: string, errorEl: HTMLSpanElement, message: string): void {
    const group = document.getElementById(groupId);
    if (!group) return;

    if (message) {
        group.classList.add('has-error');
        errorEl.textContent = message;
    } else {
        group.classList.remove('has-error');
        errorEl.textContent = '';
    }
}

function setFormError(formError: HTMLDivElement, formErrorText: HTMLSpanElement, message: string): void {
    if (message) {
        formErrorText.textContent = message;
        formError.style.display = 'flex';
    } else {
        formErrorText.textContent = '';
        formError.style.display = 'none';
    }
}


function setLoading(elements: Pick<LoginFormElements, 'btnLogin' | 'btnText' | 'btnSpinner'>, loading: boolean): void {
    elements.btnLogin.disabled = loading;
    elements.btnText.style.display = loading ? 'none' : 'inline';
    elements.btnSpinner.style.display = loading ? 'inline-block' : 'none';
}


function initPasswordToggle(elements: Pick<LoginFormElements, 'togglePassword' | 'password' | 'eyeOpen' | 'eyeClosed'>): void {
    elements.togglePassword.addEventListener('click', () => {
        const isPassword = elements.password.type === 'password';
        elements.password.type = isPassword ? 'text' : 'password';
        (elements.eyeOpen as HTMLElement).style.display = isPassword ? 'none' : 'inline';
        (elements.eyeClosed as HTMLElement).style.display = isPassword ? 'inline' : 'none';
        elements.togglePassword.setAttribute('aria-label', isPassword ? 'パスワードを非表示' : 'パスワードを表示');
    });
}

function initRealtimeValidation(elements: LoginFormElements): void {
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


async function doLogin(userId: string, password: string): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));

    throw new Error('ユーザーIDまたはパスワードが正しくありません。');
}

function initFormSubmit(elements: LoginFormElements): void {
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
        } catch (err) {
            const message = err instanceof Error ? err.message : 'ログインに失敗しました。';
            setFormError(elements.formError, elements.formErrorText, message);
        } finally {
            setLoading(elements, false);
        }
    });
}

function animateCard(card: HTMLElement): void {
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

function init(): void {
    const btnLogin = getElement<HTMLButtonElement>('btnLogin');
    const togglePassword = getElement<HTMLButtonElement>('togglePassword');

    const elements: LoginFormElements = {
        form: getElement<HTMLFormElement>('loginForm'),
        userId: getElement<HTMLInputElement>('userId'),
        password: getElement<HTMLInputElement>('password'),
        togglePassword,
        btnLogin,
        btnText: btnLogin.querySelector<HTMLSpanElement>('.btn-text')!,
        btnSpinner: btnLogin.querySelector<HTMLSpanElement>('.btn-spinner')!,
        formError: getElement<HTMLDivElement>('formError'),
        formErrorText: getElement<HTMLSpanElement>('formErrorText'),
        errorUserId: getElement<HTMLSpanElement>('error-userId'),
        errorPassword: getElement<HTMLSpanElement>('error-password'),
        eyeOpen: togglePassword.querySelector('.eye-open')!,
        eyeClosed: togglePassword.querySelector('.eye-closed')!,
    };

    initPasswordToggle(elements);
    initRealtimeValidation(elements);
    initFormSubmit(elements);

    const card = getElement<HTMLElement>('loginCard');
    animateCard(card);
}

document.addEventListener('DOMContentLoaded', init);
