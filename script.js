document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Current year for footer
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }

        // AOS Initialization
        AOS.init({
            duration: 1000,
            once: true,
        });

        const ws = new WebSocket('wss://invest-earn-backend.onrender.com');

        ws.onopen = function() {
            console.log('Connected to market data WebSocket');
            document.getElementById('market-data-status').textContent = 'Connected to real-time market data.';
        };

        ws.onmessage = function(event) {
            const marketData = JSON.parse(event.data);
            updateMarketData(marketData);
        };

        ws.onclose = function() {
            console.log('Disconnected from market data WebSocket');
            document.getElementById('market-data-status').textContent = 'Disconnected from real-time market data. Please refresh the page to reconnect.';
        };

        ws.onerror = function(error) {
            console.error('WebSocket Error:', error);
            document.getElementById('market-data-status').textContent = 'Error connecting to real-time market data.';
        };

        function formatCurrency(value, currency = '₹') {
            return `${currency} ${value.toFixed(2)}`;
        }

        function formatChange(change) {
            const sign = change >= 0 ? '+' : '';
            return `${sign}${change.toFixed(2)}%`;
        }

        function updateMarketData(data) {
            try {
                // Market Pulse
                const marketPulseData = data;
                const stockIdsMarketPulse = ['nifty50', 'bsesensex', 'niftybank', 'niftyit', 'niftypharma', 'niftymidcap100', 'niftysmallcap100', 'nifty500', 'indiavix', 'niftyauto', 'niftyfmcg', 'niftymetal', 'sp500', 'nasdaq', 'dowjones', 'msciworld', 'ftseallworld', 'djglobaltitans50', 'spglobal100', 'spglobal1200', 'gold', 'silver', 'crudeoil', 'naturalgas', 'copper', 'aluminium', 'zinc', 'lead', 'nickel', 'cotton', 'avax', 'btc', 'eth', 'xrp', 'ltc', 'ada', 'sol', 'doge', 'shib'];
                
                stockIdsMarketPulse.forEach(id => {
                    const valueElement = document.getElementById(`${id}-value`);
                    const changeElement = document.getElementById(`${id}-change`);
                    if (marketPulseData[id] && valueElement && changeElement) {
                        valueElement.textContent = formatCurrency(marketPulseData[id].value, marketPulseData[id].currency);
                        const changeFormatted = formatChange(marketPulseData[id].change);
                        changeElement.textContent = changeFormatted;

                        changeElement.classList.remove('positive', 'negative');
                        if (marketPulseData[id].change >= 0) {
                            changeElement.classList.add('positive');
                            changeElement.innerHTML = `${changeFormatted} <i class="fas fa-arrow-up"></i>`;
                        } else {
                            changeElement.classList.add('negative');
                            changeElement.innerHTML = `${changeFormatted} <i class="fas fa-arrow-down"></i>`;
                        }
                    }
                });

                // Top Stocks
                const topStocksData = data;
                const stockIdsTopStocks = ['tcs', 'reliance', 'hdfcbank', 'infosys', 'icicibank', 'sbi', 'bhartiairtel', 'itc', 'lnt', 'asianpaints', 'tatamotors', 'marutisuzuki', 'hul', 'bajajfinance', 'nestleindia', 'wipro'];
                
                stockIdsTopStocks.forEach(id => {
                    const valueElement = document.getElementById(`${id}-value`);
                    const changeElement = document.getElementById(`${id}-change`);
                    if (topStocksData[id] && valueElement && changeElement) {
                        valueElement.textContent = formatCurrency(topStocksData[id].value);
                        const changeFormatted = formatChange(topStocksData[id].change);
                        changeElement.textContent = changeFormatted;

                        changeElement.classList.remove('positive', 'negative');
                        if (topStocksData[id].change >= 0) {
                            changeElement.classList.add('positive');
                            changeElement.innerHTML = `${changeFormatted} <i class="fas fa-arrow-up"></i>`;
                        } else {
                            changeElement.classList.add('negative');
                            changeElement.innerHTML = `${changeFormatted} <i class="fas fa-arrow-down"></i>`;
                        }
                    }
                });

            } catch (error) {
                console.error('Error updating market data:', error);
                document.getElementById('market-data-status').textContent = 'Error processing market data.';
            }
        }

        // Login Form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            const loginCaptchaDisplay = document.getElementById('loginCaptchaDisplay');
            const loginGeneratedCaptcha = document.getElementById('loginGeneratedCaptcha');

                const response = await fetch('https://invest-earn-backend.onrender.com/captcha');
                const data = await response.json();
                console.log('Fetched CAPTCHA for login:', data);
                loginCaptchaDisplay.src = data.captchaImage;
                loginGeneratedCaptcha.value = data.captchaText;
            }

            refreshLoginCaptcha();
            loginCaptchaDisplay.addEventListener('click', refreshLoginCaptcha);

            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const mobile = document.getElementById('loginMobile').value;
                const password = document.getElementById('loginPassword').value;
                const captcha = document.getElementById('loginCaptcha').value;
                const generatedCaptcha = loginGeneratedCaptcha.value;
                const response = await fetch('https://invest-earn-backend.onrender.com/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ mobile, password, captcha, generatedCaptcha })
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message);
                }
            });
        }

        // Registration Form
        const registerForm = document.getElementById('registerForm');
        console.log('registerForm', registerForm);
        if (registerForm) {
            const registerCaptchaDisplay = document.getElementById('registerCaptchaDisplay');
            const registerGeneratedCaptcha = document.getElementById('registerGeneratedCaptcha');

            async function refreshRegisterCaptcha() {
                const response = await fetch('https://invest-earn-backend.onrender.com/captcha');
                const data = await response.json();
                console.log('Fetched CAPTCHA for registration:', data);
                registerCaptchaDisplay.src = data.captchaImage;
                registerGeneratedCaptcha.value = data.captchaText;
            }

            refreshRegisterCaptcha();
            registerCaptchaDisplay.addEventListener('click', refreshRegisterCaptcha);

            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('Create Account button clicked');
                const mobile = document.getElementById('registerMobile').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const captcha = document.getElementById('registerCaptcha').value;
                const generatedCaptcha = registerGeneratedCaptcha.value;
                const response = await fetch('https://invest-earn-backend.onrender.com/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ mobile, email, password, captcha, generatedCaptcha })
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message);
                }
            });
        }

        // Forgot Password
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginRegisterModal'));
                loginModal.hide();
                const forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
                forgotPasswordModal.show();
            });
        }

        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            const forgotMobile = document.getElementById('forgotMobile');
            const forgotOtpSection = document.getElementById('forgotOtpSection');
            const sendForgotOtp = document.getElementById('sendForgotOtp');
            const forgotOtp = document.getElementById('forgotOtp');
            const newPasswordSection = document.getElementById('newPasswordSection');
            const newPassword = document.getElementById('newPassword');
            const forgotPasswordSubmit = document.getElementById('forgotPasswordSubmit');

            sendForgotOtp.addEventListener('click', async function() {
                const mobileNumber = forgotMobile.value;
                const response = await fetch('https://invest-earn-backend.onrender.com/send-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ mobileNumber })
                });
                const data = await response.json();
                if (data.success) {
                    forgotOtpSection.style.display = 'block';
                    sendForgotOtp.textContent = 'Resend OTP';
                    alert(data.message);
                } else {
                    alert(data.message);
                }
            });

            forgotPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                if (newPasswordSection.style.display === 'block') {
                    // Second step: reset password
                    const mobileNumber = forgotMobile.value;
                    const otp = forgotOtp.value;
                    const newPasswordValue = newPassword.value;
                    const response = await fetch('https://invest-earn-backend.onrender.com/reset-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ mobileNumber, otp, newPassword: newPasswordValue })
                    });
                    const data = await response.json();
                    if (data.success) {
                        alert(data.message);
                        const forgotPasswordModal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                        forgotPasswordModal.hide();
                        const loginModal = new bootstrap.Modal(document.getElementById('loginRegisterModal'));
                        loginModal.show();
                    } else {
                        alert(data.message);
                    }
                } else {
                    // First step: verify OTP
                    const mobileNumber = forgotMobile.value;
                    const otp = forgotOtp.value;
                    const response = await fetch('https://invest-earn-backend.onrender.com/verify-otp', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ mobileNumber, otp })
                    });
                    const data = await response.json();
                    if (data.success) {
                        newPasswordSection.style.display = 'block';
                        forgotPasswordSubmit.textContent = 'Submit New Password';
                    } else {
                        alert(data.message);
                    }
                }
            });
        }

        const toggleLoginPassword = document.getElementById('toggleLoginPassword');
        if (toggleLoginPassword) {
            toggleLoginPassword.addEventListener('click', function() {
                const password = document.getElementById('loginPassword');
                const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
                password.setAttribute('type', type);
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }

        const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
        if (toggleRegisterPassword) {
            toggleRegisterPassword.addEventListener('click', function() {
                const password = document.getElementById('registerPassword');
                const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
                password.setAttribute('type', type);
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }

        const toggleNewPassword = document.getElementById('toggleNewPassword');
        if (toggleNewPassword) {
            toggleNewPassword.addEventListener('click', function() {
                const password = document.getElementById('newPassword');
                const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
                password.setAttribute('type', type);
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
});