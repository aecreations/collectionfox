# Makefile for CollectionFox

EXT_VER=`python3 ./getver.py`
DIST_FILE=readnext-$(EXT_VER).zip
EXCLUDE=*~ *\.pl *\.py Makefile


$(DIST_FILE):
	cp -v ../LICENSE.txt .
	zip -r $(DIST_FILE) * -x $(EXCLUDE)

clean:
	rm -fv $(DIST_FILE)
	rm -fv LICENSE.txt

# END Makefile
