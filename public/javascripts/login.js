document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchButton = document.getElementById('switchButton');
    const formTitle = document.getElementById('formTitle');
    const switchFormText = document.getElementById('switchForm');

    function switchForms() {
        if (loginForm.style.display === 'none') {
            registerForm.classList.add('fade-out');
            setTimeout(() => {
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                loginForm.classList.add('fade-in');
                formTitle.textContent = 'Sign In';
                switchButton.textContent = 'Register';
                switchFormText.innerHTML = "Don't have an account? <a href='#' id='switchButton'>Register</a>";
            }, 500);
        } else {
            loginForm.classList.add('fade-out');
            setTimeout(() => {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                registerForm.classList.add('fade-in');
                formTitle.textContent = 'Register';
                switchButton.textContent = 'Sign In';
                switchFormText.innerHTML = "Already have an account? <a href='#' id='switchButton'>Sign In</a>";
            }, 500);
        }
    }

    document.body.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'switchButton') {
            e.preventDefault();
            switchForms();
        }
    });
});
function otpgenerator() {
    let number = '';
    for (let i = 0; i < 6; i++) {
        let nu = Math.floor(10 * Math.random());
        number += nu;
    }
    return number;
}

let generatedOtp;

document.getElementById("otp").addEventListener("click", function (event) {
    event.preventDefault();
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;
    const email = document.getElementById("registerEmail").value;

    if (username && password && email) {
        generatedOtp = otpgenerator();
        fetch(`/otp/${email}/${generatedOtp}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (response.ok) {
                    alert('OTP sent successfully');
                    document.getElementById("button").disabled = false;
                } else {
                    alert('Failed to send OTP');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred');
            });
    } else {
        alert('Fill all details before generatingg OTP');
    }
});

document.getElementById("button").addEventListener("click", function (event) {
    event.preventDefault();
    const enteredOtp = document.getElementById("verifyEmail").value;
    if (enteredOtp === generatedOtp) {
        document.getElementById("registerForm").submit();
    } else {
        alert("Invalid OTP");
        document.getElementById("button").disabled = true;
    }
});