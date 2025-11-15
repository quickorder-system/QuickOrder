// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// TOS Checkbox logic
const tosCheckbox = document.getElementById('tosCheckbox');
const getStartedBtn = document.getElementById('getStartedBtn');
const getStartedBtn2 = document.getElementById('getStartedBtn2');

function updateButtonState() {
    const isChecked = tosCheckbox && tosCheckbox.checked;
    if (!getStartedBtn || !getStartedBtn2) return;
    if (isChecked) {
        getStartedBtn.style.opacity = '1';
        getStartedBtn.style.cursor = 'pointer';
        getStartedBtn.style.pointerEvents = 'auto';
        getStartedBtn2.style.opacity = '1';
        getStartedBtn2.style.cursor = 'pointer';
        getStartedBtn2.style.pointerEvents = 'auto';
    } else {
        getStartedBtn.style.opacity = '0.5';
        getStartedBtn.style.cursor = 'not-allowed';
        getStartedBtn.style.pointerEvents = 'none';
        getStartedBtn2.style.opacity = '0.5';
        getStartedBtn2.style.cursor = 'not-allowed';
        getStartedBtn2.style.pointerEvents = 'none';
    }
}

// Initialize button state
updateButtonState();

tosCheckbox?.addEventListener('change', updateButtonState);

getStartedBtn?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!tosCheckbox || !tosCheckbox.checked) {
        openAlertModal();
    } else {
        window.location.href = 'menu.html';
    }
});

getStartedBtn2?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!tosCheckbox || !tosCheckbox.checked) {
        openAlertModal();
    } else {
        window.location.href = 'menu.html';
    }
});

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Alert Modal functions
function openAlertModal() {
    document.getElementById('alertModal').classList.add('show');
}

function closeAlertModal() {
    document.getElementById('alertModal').classList.remove('show');
    // Scroll to the TOS checkbox to draw attention
    const tosBox = document.querySelector('.tos-checkbox');
    if (tosBox) {
        tosBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        tosBox.style.transform = 'scale(1.1)';
        tosBox.style.transition = 'transform 0.3s';
        setTimeout(() => {
            tosBox.style.transform = 'scale(1)';
        }, 300);
    }
}

// Click outside to close
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
    if (e.target.classList.contains('alert-modal')) {
        closeAlertModal();
    }
});

// Modal triggers
document.getElementById('tosLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    openModal('tosModal');
});

document.getElementById('aboutLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    openModal('aboutModal');
});

document.getElementById('contactsLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    openModal('contactsModal');
});
