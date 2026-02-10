'use strict';

const firebaseConfig = {
    apiKey: "AIzaSyDiVVazpZPy0rHOFDwc2u9NvAKKNR3k1kI",
    authDomain: "club-lenjambee.firebaseapp.com",
    projectId: "club-lenjambee",
    storageBucket: "club-lenjambee.firebasestorage.app",
    messagingSenderId: "696386646375",
    appId: "1:696386646375:web:09e6aa8440325efc5affc2"
};

const GOFUNDME_URL = "https://gofund.me/7d33f9335";

const elements = {
    header: document.querySelector('.header'),
    modal: document.getElementById('donationModal'),
    openModalButtons: document.querySelectorAll('[data-open-modal]'),
    closeModalButtons: document.querySelectorAll('[data-close-modal]'),
    formView: document.getElementById('formView'),
    successView: document.getElementById('successView'),
    form: document.getElementById('donationForm'),
    submitBtn: document.getElementById('submitBtn'),
    btnText: document.querySelector('.btn__text'),
    btnLoader: document.querySelector('.btn__loader'),
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    member: document.getElementById('member'),
    amount: document.getElementById('amount'),
    taxReceipt: document.getElementById('taxReceipt'),
    gofundmeConfirm: document.getElementById('gofundmeConfirm'),
    taxFields: document.getElementById('taxFields'),
    address: document.getElementById('address'),
    city: document.getElementById('city'),
    province: document.getElementById('province'),
    postalCode: document.getElementById('postalCode'),
    phone: document.getElementById('phone'),
    donationSummary: document.getElementById('donationSummary'),
    gofundmeLink: document.getElementById('gofundmeLink')
};

let db = null;

function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        return db;
    } catch (error) {
        return null;
    }
}

function openModal() {
    elements.modal.classList.add('is-open');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => elements.firstName.focus(), 100);
}

function closeModal() {
    elements.modal.classList.remove('is-open');
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setTimeout(() => resetModal(), 300);
}

function resetModal() {
    elements.form.reset();
    elements.taxFields.hidden = true;
    clearAllErrors();
    elements.formView.hidden = false;
    elements.successView.hidden = true;
    setButtonLoading(false);
}

function handleEscapeKey(event) {
    if (event.key === 'Escape' && elements.modal.classList.contains('is-open')) {
        closeModal();
    }
}

const validationRules = {
    firstName: { required: true, message: 'Le prénom est requis' },
    lastName: { required: true, message: 'Le nom est requis' },
    email: { 
        required: true, 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
        message: 'Veuillez entrer un courriel valide' 
    },
    member: { required: true, message: 'Veuillez sélectionner un membre' },
    amount: { required: true, min: 1, message: 'Veuillez entrer un montant valide (minimum 1$)' },
    gofundmeConfirm: { required: true, message: 'Vous devez confirmer avoir compris le processus' },
    address: { requiredIf: 'taxReceipt', message: 'L\'adresse est requise pour le reçu d\'impôt' },
    city: { requiredIf: 'taxReceipt', message: 'La ville est requise pour le reçu d\'impôt' },
    province: { requiredIf: 'taxReceipt', message: 'La province est requise pour le reçu d\'impôt' },
    postalCode: { 
        requiredIf: 'taxReceipt', 
        pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 
        message: 'Veuillez entrer un code postal valide (ex: A1A 1A1)' 
    },
    phone: { 
        requiredIf: 'taxReceipt', 
        pattern: /^[\d\s\-\(\)\.+]{10,}$/, 
        message: 'Veuillez entrer un numéro de téléphone valide' 
    }
};

function validateField(fieldName, value) {
    const rules = validationRules[fieldName];
    if (!rules) return null;
    
    if (rules.requiredIf) {
        const conditionField = document.getElementById(rules.requiredIf);
        if (!conditionField.checked) return null;
    }
    
    if (rules.required || rules.requiredIf) {
        if (typeof value === 'boolean' && !value) return rules.message;
        if (typeof value === 'string' && !value.trim()) return rules.message;
        if (typeof value === 'number' && isNaN(value)) return rules.message;
    }
    
    if (rules.pattern && value && !rules.pattern.test(value)) return rules.message;
    if (rules.min !== undefined && value && Number(value) < rules.min) return rules.message;
    
    return null;
}

function showError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorSpan = document.getElementById(`${fieldName}Error`);
    if (field) field.classList.add('error');
    if (errorSpan) errorSpan.textContent = message;
}

function clearError(fieldName) {
    const field = document.getElementById(fieldName);
    const errorSpan = document.getElementById(`${fieldName}Error`);
    if (field) field.classList.remove('error');
    if (errorSpan) errorSpan.textContent = '';
}

function clearAllErrors() {
    Object.keys(validationRules).forEach(fieldName => clearError(fieldName));
}

function validateForm() {
    let isValid = true;
    clearAllErrors();
    
    const fieldsToValidate = [
        { name: 'firstName', value: elements.firstName.value },
        { name: 'lastName', value: elements.lastName.value },
        { name: 'email', value: elements.email.value },
        { name: 'member', value: elements.member.value },
        { name: 'amount', value: elements.amount.value },
        { name: 'gofundmeConfirm', value: elements.gofundmeConfirm.checked }
    ];
    
    if (elements.taxReceipt.checked) {
        fieldsToValidate.push(
            { name: 'address', value: elements.address.value },
            { name: 'city', value: elements.city.value },
            { name: 'province', value: elements.province.value },
            { name: 'postalCode', value: elements.postalCode.value },
            { name: 'phone', value: elements.phone.value }
        );
    }
    
    fieldsToValidate.forEach(({ name, value }) => {
        const error = validateField(name, value);
        if (error) {
            showError(name, error);
            isValid = false;
        }
    });
    
    return isValid;
}

function toggleTaxFields() {
    const showTaxFields = elements.taxReceipt.checked;
    elements.taxFields.hidden = !showTaxFields;
    
    const taxFieldInputs = [elements.address, elements.city, elements.province, elements.postalCode, elements.phone];
    taxFieldInputs.forEach(input => {
        if (input) {
            input.required = showTaxFields;
            if (!showTaxFields) clearError(input.id);
        }
    });
}

function setButtonLoading(loading) {
    elements.submitBtn.disabled = loading;
    elements.btnText.hidden = loading;
    elements.btnLoader.hidden = !loading;
}

function prepareFormData() {
    const data = {
        firstName: elements.firstName.value.trim(),
        lastName: elements.lastName.value.trim(),
        email: elements.email.value.trim().toLowerCase(),
        member: elements.member.value,
        memberDisplayName: elements.member.options[elements.member.selectedIndex].text,
        amount: parseFloat(elements.amount.value),
        taxReceipt: elements.taxReceipt.checked,
        address: {},
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        donationConfirmed: false
    };
    
    if (elements.taxReceipt.checked) {
        data.address = {
            street: elements.address.value.trim(),
            city: elements.city.value.trim(),
            province: elements.province.value,
            postalCode: elements.postalCode.value.trim().toUpperCase(),
            phone: elements.phone.value.trim()
        };
    }
    
    return data;
}

async function submitToFirebase(data) {
    if (!db) {
        throw new Error('Firebase n\'est pas initialisé. Veuillez configurer firebaseConfig.');
    }
    
    const docRef = await db.collection('donations').add(data);
    return docRef.id;
}

function showSuccess(data) {
    elements.formView.hidden = true;
    elements.successView.hidden = false;
    
    elements.donationSummary.innerHTML = `
        <p><span>Donateur</span><strong>${data.firstName} ${data.lastName}</strong></p>
        <p><span>Courriel</span><strong>${data.email}</strong></p>
        <p><span>Pour</span><strong>${data.memberDisplayName}</strong></p>
        <p><span>Montant</span><strong>${data.amount.toFixed(2)} $</strong></p>
        <p><span>Reçu d'impôt</span><strong>${data.taxReceipt ? 'Oui' : 'Non'}</strong></p>
    `;
    
    elements.gofundmeLink.href = GOFUNDME_URL;
}

function showSubmitError(error) {
    console.error('❌ Erreur de soumission:', error);
    
    let errorMessage = 'Une erreur est survenue. ';
    
    if (error.message.includes('Firebase n\'est pas initialisé')) {
        errorMessage += 'La configuration Firebase est manquante. Contactez l\'administrateur.';
    } else if (error.code === 'permission-denied') {
        errorMessage += 'Accès refusé. Vérifiez les règles Firestore.';
    } else if (error.code === 'unavailable') {
        errorMessage += 'Service temporairement indisponible. Réessayez plus tard.';
    } else {
        errorMessage += 'Veuillez réessayer ou contacter l\'équipe.';
    }
    
    alert(errorMessage);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        const firstError = document.querySelector('.form__input.error, .form__select.error');
        if (firstError) firstError.focus();
        return;
    }
    
    setButtonLoading(true);
    
    try {
        const formData = prepareFormData();
        await submitToFirebase(formData);
        showSuccess(formData);
    } catch (error) {
        showSubmitError(error);
    } finally {
        setButtonLoading(false);
    }
}

function handleScroll() {
    const scrolled = window.scrollY > 50;
    elements.header.classList.toggle('scrolled', scrolled);
}

function setupMobileNav() {
    const toggle = document.querySelector('.nav__mobile-toggle');
    const menu = document.querySelector('.nav__menu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('is-open');
            toggle.classList.toggle('is-active');
        });
        
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('is-open');
                toggle.classList.remove('is-active');
            });
        });
    }
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            if (!targetId || !targetId.startsWith('#') || targetId.length === 1) {
                return;
            }

            e.preventDefault();

            const target = document.querySelector(targetId);
            if (!target) return;

            const headerHeight = elements.header.offsetHeight;
            const targetPosition =
                target.getBoundingClientRect().top +
                window.scrollY -
                headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

function init() {
    db = initializeFirebase();
    
    elements.openModalButtons.forEach(btn => {
        btn.addEventListener('click', openModal);
    });
    
    elements.closeModalButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    document.addEventListener('keydown', handleEscapeKey);
    elements.taxReceipt.addEventListener('change', toggleTaxFields);
    elements.form.addEventListener('submit', handleFormSubmit);
    
    const fieldsToValidateOnBlur = [
        'firstName', 'lastName', 'email', 'member', 'amount',
        'address', 'city', 'province', 'postalCode', 'phone'
    ];
    
    fieldsToValidateOnBlur.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.addEventListener('blur', () => {
                const error = validateField(fieldName, field.value);
                if (error) {
                    showError(fieldName, error);
                } else {
                    clearError(fieldName);
                }
            });
            
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    const error = validateField(fieldName, field.value);
                    if (!error) clearError(fieldName);
                }
            });
        }
    });
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    setupMobileNav();
    setupSmoothScroll();
    elements.gofundmeLink.href = GOFUNDME_URL;
}

document.addEventListener('DOMContentLoaded', init);
