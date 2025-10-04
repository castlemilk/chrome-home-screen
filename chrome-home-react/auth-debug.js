function output(msg) {
    const el = document.getElementById('output');
    el.innerText += msg + '\n';
    el.scrollTop = el.scrollHeight;
}

async function checkAuth() {
    output('\n=== Checking Auth Status ===');
    const data = await chrome.storage.local.get([
        'ext_auth_token', 
        'ext_identity', 
        'backend_registered',
        'registration_time',
        'auth_version',
        'install_time'
    ]);
    output('Storage Data:\n' + JSON.stringify(data, null, 2));
    
    // Decode token to check timestamp
    if (data.ext_auth_token) {
        try {
            const parts = data.ext_auth_token.split('.');
            const decoded = JSON.parse(atob(parts[0]));
            const ageInSeconds = Date.now()/1000 - decoded.ts;
            const ageInHours = ageInSeconds / 3600;
            output('\nToken Details:');
            output('  Age: ' + ageInHours.toFixed(2) + ' hours');
            output('  Created: ' + new Date(decoded.ts * 1000).toISOString());
            output('  Extension ID: ' + decoded.ext);
            
            if (ageInHours > 24) {
                output('  WARNING: Token is EXPIRED (>24 hours old)');
            } else {
                output('  OK: Token is valid');
            }
        } catch (e) {
            output('Error decoding token: ' + e.message);
        }
    } else {
        output('ERROR: No token found\!');
    }
    
    if (data.backend_registered) {
        const regTime = new Date(data.registration_time);
        output('\nOK: Backend registered at: ' + regTime.toISOString());
    } else {
        output('\nERROR: NOT registered with backend\!');
    }
}

async function clearAuth() {
    output('\n=== Clearing Authentication ===');
    await chrome.storage.local.remove([
        'ext_auth_token',
        'ext_identity', 
        'backend_registered',
        'registration_time',
        'auth_version',
        'install_time'
    ]);
    output('OK: Auth data cleared');
    output('Reloading extension to trigger re-registration...');
    
    setTimeout(() => {
        chrome.runtime.reload();
    }, 1000);
}

async function testBackend() {
    output('\n=== Testing Backend Connection ===');
    
    // Get current auth token
    const stored = await chrome.storage.local.get(['ext_auth_token', 'ext_identity']);
    
    if (\!stored.ext_auth_token || \!stored.ext_identity) {
        output('ERROR: No auth token found. Please clear auth and reload.');
        return;
    }
    
    output('Testing registration endpoint...');
    
    try {
        const response = await fetch('https://weather-service-fws6uj4tlq-uc.a.run.app/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Extension-Token': stored.ext_auth_token,
                'X-Extension-ID': stored.ext_identity.extensionId,
                'X-Extension-Version': stored.ext_identity.extensionVersion
            },
            body: JSON.stringify({
                identity: stored.ext_identity,
                timestamp: Math.floor(Date.now() / 1000)
            })
        });
        
        const text = await response.text();
        output('Response Status: ' + response.status);
        output('Response: ' + text);
        
        if (response.ok) {
            output('OK: Registration successful\!');
            await chrome.storage.local.set({
                backend_registered: true,
                registration_time: Date.now()
            });
        } else {
            output('ERROR: Registration failed');
        }
    } catch (error) {
        output('ERROR: ' + error.message);
    }
}

// Auto-check on load
setTimeout(checkAuth, 500);
