/**
 * Version Check and Cache Clear
 * This script checks the version from GitHub and clears cache if it's different
 */

(function() {
    'use strict';

    // GitHub raw URL for version.js - replace with your actual GitHub repository URL
    const GITHUB_VERSION_URL = 'https://raw.githubusercontent.com/AstraEditor/scratch-gui/refs/heads/develop/src/lib/version-check/version.js';
    
    // Storage key for last checked Refused to
    const STORAGE_KEY = 'ae_last_checked_version';

    async function fetchRemoteVersion() {
        try {
            const response = await fetch(GITHUB_VERSION_URL);
            if (!response.ok) {
                console.warn('Failed to fetch remote version:', response.status);
                return null;
            }
            const text = await response.text();
            
            // Parse version from the file
            const versionMatch = text.match(/const AE_VERSION = "([^"]+)"/);
            const buildMatch = text.match(/const AE_BUILD = "([^"]+)"/);
            
            if (versionMatch && buildMatch) {
                return {
                    version: versionMatch[1],
                    build: buildMatch[1]
                };
            }
            return null;
        } catch (error) {
            console.warn('Error fetching remote version:', error);
            return null;
        }
    }

    function clearCacheAndReload() {
        console.log('Version mismatch detected, clearing cache...');
        
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        return caches.delete(cacheName);
                    })
                );
            }).then(function() {
                // Clear localStorage for version check
                try {
                    localStorage.removeItem(STORAGE_KEY);
                } catch (e) {
                    // ignore
                }
                
                // Reload with cache busting
                const url = new URL(window.location.href);
                url.searchParams.set('v', Date.now());
                window.location.replace(url.toString());
            });
        } else {
            // Fallback: just reload with cache busting
            const url = new URL(window.location.href);
            url.searchParams.set('v', Date.now());
            window.location.replace(url.toString());
        }
    }

    async function checkVersion() {
        // Check if we've already checked recently (within 5 minutes)
        try {
            const lastChecked = localStorage.getItem(STORAGE_KEY);
            if (lastChecked) {
                const lastCheckedTime = parseInt(lastChecked, 10);
                if (Date.now() - lastCheckedTime < 5 * 60 * 1000) {
                    console.log('Version checked recently, skipping');
                    return;
                }
            }
        } catch (e) {
            // ignore
        }

        // Fetch local version from version.js
        let localVersion = null;
        try {
            const localVersionResponse = await fetch(window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '') + '/lib/version-check/version.js?t=' + Date.now());
            if (localVersionResponse.ok) {
                const localText = await localVersionResponse.text();
                const versionMatch = localText.match(/const AE_VERSION = "([^"]+)"/);
                const buildMatch = localText.match(/const AE_BUILD = "([^"]+)"/);
                if (versionMatch && buildMatch) {
                    localVersion = versionMatch[1] + '.' + buildMatch[1];
                }
            }
        } catch (e) {
            console.warn('Error fetching local version:', e);
        }

        if (!localVersion) {
            console.warn('Could not fetch local version, skipping version check');
            return;
        }

        const remoteVersion = await fetchRemoteVersion();
        
        if (remoteVersion) {
            const remoteVersionString = remoteVersion.version + '.' + remoteVersion.build;
            
            console.log('Local version:', localVersion);
            console.log('Remote version:', remoteVersionString);
            
            if (localVersion !== remoteVersionString) {
                console.log('Version mismatch detected!');
                clearCacheAndReload();
            } else {
                // Save the check time
                try {
                    localStorage.setItem(STORAGE_KEY, Date.now().toString());
                } catch (e) {
                    // ignore
                }
            }
        } else {
            // If we can't fetch the remote version, clear cache to be safe
            console.warn('Could not fetch remote version, clearing cache as precaution');
            clearCacheAndReload();
        }
    }

    // Run version check when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkVersion);
    } else {
        checkVersion();
    }

})();