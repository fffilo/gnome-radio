INSTALL_PATH = ~/.local/share/gnome-shell/extensions
INSTALL_NAME = gnome-radio@gnome-shell-exstensions.fffilo.github.com
BUILD_DIR = _build

install: build
	rm -rf $(INSTALL_PATH)/$(INSTALL_NAME)
	mkdir -p $(INSTALL_PATH)/$(INSTALL_NAME)
	cp -r --preserve=timestamps $(BUILD_DIR)/* $(INSTALL_PATH)/$(INSTALL_NAME)
	rm -rf $(BUILD_DIR)
	echo Installed in $(INSTALL_PATH)/$(INSTALL_NAME)

build: compile-schema
	rm -rf $(BUILD_DIR)
	mkdir $(BUILD_DIR)
	cp -r --preserve=timestamps config.js config.json convenience.js extension.js icons lib.js metadata.json player.js prefs.css prefs.js README.md schemas screenshot.png stylesheet.css ui.js $(BUILD_DIR)
	echo Build was successfull

compile-schema: ./schemas/org.gnome.shell.extensions.gnome-radio.gschema.xml
	glib-compile-schemas schemas

clean:
	rm -rf $(BUILD_DIR)

uninstall:
	rm -rf $(INSTALL_PATH)/$(INSTALL_NAME)
