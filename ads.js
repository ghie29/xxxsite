    /* ── Ad Loading ── */
    
    // Desktop Top Ads (728x90)
    const desktopTop1 = document.createElement('script');
    desktopTop1.innerHTML = `
        atOptions = {
            'key' : '8a1cc3ddf2f3049db9c41a43da6a8e24',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
        };
    `;
    document.getElementById('desktopAdTop1').appendChild(desktopTop1);
    
    const desktopTop2 = document.createElement('script');
    desktopTop2.innerHTML = `
        atOptions = {
            'key' : '8a1cc3ddf2f3049db9c41a43da6a8e24',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
        };
    `;
    document.getElementById('desktopAdTop2').appendChild(desktopTop2);
    
    // Load the invoke script for desktop top
    const invokeTop1 = document.createElement('script');
    invokeTop1.src = 'https://www.highrevenueformat.com/8a1cc3ddf2f3049db9c41a43da6a8e24/invoke.js';
    document.getElementById('desktopAdTop1').appendChild(invokeTop1);
    
    const invokeTop2 = document.createElement('script');
    invokeTop2.src = 'https://www.highrevenueformat.com/8a1cc3ddf2f3049db9c41a43da6a8e24/invoke.js';
    document.getElementById('desktopAdTop2').appendChild(invokeTop2);
    
    // Desktop Bottom Ads (728x90)
    const desktopBottom1 = document.createElement('script');
    desktopBottom1.innerHTML = `
        atOptions = {
            'key' : '8a1cc3ddf2f3049db9c41a43da6a8e24',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
        };
    `;
    document.getElementById('desktopAdBottom1').appendChild(desktopBottom1);
    
    const desktopBottom2 = document.createElement('script');
    desktopBottom2.innerHTML = `
        atOptions = {
            'key' : '8a1cc3ddf2f3049db9c41a43da6a8e24',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
        };
    `;
    document.getElementById('desktopAdBottom2').appendChild(desktopBottom2);
    
    const invokeBottom1 = document.createElement('script');
    invokeBottom1.src = 'https://www.highrevenueformat.com/8a1cc3ddf2f3049db9c41a43da6a8e24/invoke.js';
    document.getElementById('desktopAdBottom1').appendChild(invokeBottom1);
    
    const invokeBottom2 = document.createElement('script');
    invokeBottom2.src = 'https://www.highrevenueformat.com/8a1cc3ddf2f3049db9c41a43da6a8e24/invoke.js';
    document.getElementById('desktopAdBottom2').appendChild(invokeBottom2);
    
    // Mobile Top Ad (320x50)
    const mobileTop = document.createElement('script');
    mobileTop.innerHTML = `
        atOptions = {
            'key' : 'aadbb3c98e989d35cf46988acd09af43',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
        };
    `;
    document.getElementById('mobileAdTop').appendChild(mobileTop);
    
    const invokeMobileTop = document.createElement('script');
    invokeMobileTop.src = 'https://www.highrevenueformat.com/aadbb3c98e989d35cf46988acd09af43/invoke.js';
    document.getElementById('mobileAdTop').appendChild(invokeMobileTop);
    
    // Mobile Bottom Ad (320x50)
    const mobileBottom = document.createElement('script');
    mobileBottom.innerHTML = `
        atOptions = {
            'key' : 'aadbb3c98e989d35cf46988acd09af43',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
        };
    `;
    document.getElementById('mobileAdBottom').appendChild(mobileBottom);
    
    const invokeMobileBottom = document.createElement('script');
    invokeMobileBottom.src = 'https://www.highrevenueformat.com/aadbb3c98e989d35cf46988acd09af43/invoke.js';
    document.getElementById('mobileAdBottom').appendChild(invokeMobileBottom);
    
    // Sidebar Ads (300x250)
    const sidebar1 = document.createElement('script');
    sidebar1.innerHTML = `
        atOptions = {
            'key' : '4628c2f675a5c2e457e3a9761dff8ade',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
        };
    `;
    document.getElementById('sidebarAd1Container').appendChild(sidebar1);
    
    const invokeSidebar1 = document.createElement('script');
    invokeSidebar1.src = 'https://www.highrevenueformat.com/4628c2f675a5c2e457e3a9761dff8ade/invoke.js';
    document.getElementById('sidebarAd1Container').appendChild(invokeSidebar1);
    
    const sidebar2 = document.createElement('script');
    sidebar2.innerHTML = `
        atOptions = {
            'key' : '4628c2f675a5c2e457e3a9761dff8ade',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
        };
    `;
    document.getElementById('sidebarAd2Container').appendChild(sidebar2);
    
    const invokeSidebar2 = document.createElement('script');
    invokeSidebar2.src = 'https://www.highrevenueformat.com/4628c2f675a5c2e457e3a9761dff8ade/invoke.js';
    document.getElementById('sidebarAd2Container').appendChild(invokeSidebar2);
}

// Load ads when the page loads
document.addEventListener('DOMContentLoaded', loadAds);

// Reload ads when going back from player page
function reloadAds() {
    // Clear existing ads and reload
    const adContainers = document.querySelectorAll('#desktopAdTop1, #desktopAdTop2, #desktopAdBottom1, #desktopAdBottom2, #mobileAdTop, #mobileAdBottom, #sidebarAd1Container, #sidebarAd2Container');
    adContainers.forEach(container => {
        container.innerHTML = '';
    });
    loadAds();
}