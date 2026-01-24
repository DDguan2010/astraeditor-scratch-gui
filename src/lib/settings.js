
export class AESettings {
        constructor() {
                this.storageKey = "AESettings";
                this.init();
                this.initset = {
                        enableREADMEAutoDisplay: true,
                        skipExtWarn: false,
                        EnableExtensionPreview: false
                };
        }

        init() {
                if (!localStorage.getItem(this.storageKey)) {
                        const defaultSettings = this.initset
                        this.save(defaultSettings);
                }
        }

        getAll() {
                const stored = localStorage.getItem(this.storageKey) || false;
                return stored ? JSON.parse(stored) : {};
        }

        get(id) {

                const settings = this.getAll();
                return settings[id];
        }

        set(id, value) {
                const settings = this.getAll();
                settings[id] = value;
                this.save(settings);
                return settings;
        }

        save(settings) {
                localStorage.setItem(this.storageKey, JSON.stringify(settings));
        }
        reset() {
                const defaultSettings = this.initset;
                this.save(defaultSettings);
                return defaultSettings;
        }
}