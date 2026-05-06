document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('applicationForm');
    const messageBox = document.getElementById('messageBox');
    const submitBtn = document.getElementById('submitBtn');

    // show message helper function
    function showMessage(msg, isSuccess) {
        messageBox.innerHTML = isSuccess ? `<i class="fas fa-check-circle"></i> ${msg}` : `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        messageBox.className = 'message ' + (isSuccess ? 'success' : 'error');
        // hide message after 5 seconds
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    // clear field errors
    function clearErrors() {
        document.querySelectorAll('.field-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }

    // show field error
    function showFieldError(id, msg) {
        const errEl = document.getElementById(id + 'Error');
        if (errEl) {
            errEl.textContent = msg;
            errEl.style.display = 'block';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        
        let hasError = false;

        // get values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const college = document.getElementById('college').value.trim();
        const year = document.getElementById('year').value;
        const skills = document.getElementById('skills').value.trim();
        const linkedin = document.getElementById('linkedin').value.trim();
        const portfolio = document.getElementById('portfolio').value.trim();
        const resumeInput = document.getElementById('resume');
        
        // basic frontend validation
        if (!name) { showFieldError('name', 'Name is required'); hasError = true; }
        if (!email || !email.includes('@') || !email.includes('.')) { 
            showFieldError('email', 'Valid email is required'); 
            hasError = true; 
        }
        if (!phone) { showFieldError('phone', 'Phone is required'); hasError = true; }
        if (!college) { showFieldError('college', 'College is required'); hasError = true; }
        if (!year) { showFieldError('year', 'Please select a year'); hasError = true; }
        if (!skills) { showFieldError('skills', 'Skills are required'); hasError = true; }

        // check if file is selected and is a pdf
        if (resumeInput.files.length === 0) {
            showFieldError('resume', 'Please select a resume file');
            hasError = true;
        } else {
            const file = resumeInput.files[0];
            if (file.type !== 'application/pdf') {
                showFieldError('resume', 'Only PDF files are allowed');
                hasError = true;
            } else if (file.size > 2 * 1024 * 1024) {
                showFieldError('resume', 'File size exceeds 2MB limit');
                hasError = true;
            }
        }

        if (hasError) return;

        // disable button to prevent multiple submissions
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        // prepare form data for sending to backend
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('college', college);
        formData.append('year', year);
        formData.append('skills', skills);
        formData.append('linkedin', linkedin);
        formData.append('portfolio', portfolio);
        formData.append('resume', resumeInput.files[0]);

        try {
            // send data to backend API
            const response = await fetch('/api/apply', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showMessage("Application submitted successfully!", true);
                form.reset(); // clear the form on success
            } else {
                showMessage(result.message || "Failed to submit application.", false);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showMessage("A server error occurred. Please try again later.", false);
        } finally {
            // re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
        }
    });
});
