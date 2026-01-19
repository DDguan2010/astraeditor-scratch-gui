export class AESettings {
        constructor() {
                this.storageKey = "AESettings";
                this.init();
        }

        init() {
                if (!localStorage.getItem(this.storageKey)) {
                        const defaultSettings = {
                                enableREADMEAutoDisplay: true,
                                skipExtWarn: false
                        };
                        this.save(defaultSettings);
                }
        }

        getAll() {
                const stored = localStorage.getItem(this.storageKey);
                return stored ? JSON.parse(stored) : {};
        }

        get(id) {
               
                const settings = this.getAll();
                 console.log(settings[id])
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
                const defaultSettings = {
                        enableREADMEAutoDisplay: true,
                        skipExtWarn: false
                };
                this.save(defaultSettings);
                return defaultSettings;
        }
}