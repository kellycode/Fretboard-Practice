

class Fretboard {
    constructor() {
        this.notes = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D'];
        this.fretNotes = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
        this.frets = $('#notes .fret');

        this.vwToPx = window.innerWidth / 100;
        // string tuning (far left)
        // TODO tunings static atm
        this.keyNotes;

        // set in setSectionNotesToArrays()
        this.sectionNotes = {
            'section1': [],
            'section2': [],
            'section3': []
        };

        // set first time in init()
        // active notes based on active sections
        this.currentActiveNotes;
        // shuffled array of above
        // first one is the working copy
        // that we shiftnotes off of, when
        // it's empty we refresh it with the copy;
        this.currentShuffledNotes;
        this.currentShuffledNotesCopy;

        // current displayed note
        this.currentNote;
        // current displayed jq element
        this.currentNoteJqElem;

        this.seekerString = '';

        this.fret_selects = this.getFretSelects();

        this.init();
    }

    init() {
        // for section switching
        this.initSectionToggle(this);
        // for string switching
        this.initStringToggle(this);
        // for string fretboard perspective
        this.initPerspectiveSwitch(this);
        // for hide/show tuning notes
        // too tempting to keep looking to count notes
        this.initTuningSwitch(this);
        // for keyboard users
        this.initKeydownListener(this);
        // get the string tunings
        this.keyNotes = this.getTunings();
        // assign the notes per tuning
        this.setNotes(this.keyNotes);
        // get an array of notes for each section
        this.setSectionNotesToArrays();
        // determined the selected sections
        // and set active notes
        this.getActiveNotes();
        // start
        this.showANote();
    }

    // set previous section and string selections
    setFretSelects(selects) {
        const selectsArray = selects.split(',');

        for (const id of selectsArray) {
            $('#' + id).addClass('selected');
        }
    }

    // get the cookie containing
    // previous section and string selections
    getFretSelects() {
        let fret_selects = CookieMgr.getCookie('fret_selects');

        // use a default if needed
        if (!fret_selects) {
            fret_selects = 'section1,section2,section3,tuningStr1,tuningStr2,tuningStr3,tuningStr4,tuningStr5,tuningStr6,inline_buttons';
        }

        this.setFretSelects(fret_selects);
    }

    // this is for maintaining the current selections in a cookie
    rememberSelectionsChanged() {
        // seeker refers to tuning notes and section selectors
        let selects = $('.seeker.selected'); // not tunings
        let temp = [];
        let selectIds = '';
        selects.each(function () {
            temp.push($(this).attr('id'));
        });
        selectIds = temp.toString();
        CookieMgr.setCookie('fret_selects', selectIds, 30);
    }

    initSectionToggle(self) {
        $('.section').click(function () {
            $(this).toggleClass("selected");
            self.getActiveNotes();
            self.clearCurrentNote();
            self.rememberSelectionsChanged();
            // and go again
            self.showANote();
        });
    }

    initStringToggle(self) {
        $('.tnote').click(function () {
            $(this).toggleClass("selected");
            self.getActiveNotes();
            self.clearCurrentNote();
            self.rememberSelectionsChanged();
            // and go again
            self.showANote();
        });
    }

    initPerspectiveSwitch(self) {
        $('#persp_switch').click(function () {
            $('#fretboard').toggleClass("selected");
            self.rememberSelectionsChanged();
        });
    }

    initTuningSwitch() {
        $('#hideShow').click(function () {
            $('#tunings').toggleClass("selected");
            $('#hideShow').toggleClass("off");
            //the tunings should always be visible to start
            //so not cookie saved
            //self.rememberSelectionsChanged();
        });
    }

    initKeydownListener(self) {
        document.addEventListener('keydown', function (event) {
            const key = event.key;
            self.checkNoteClick(key.toUpperCase());
        });
    }

    // called when sections change and before showANote()
    clearCurrentNote() {
        // restoring 'hidden' status
        this.currentNoteJqElem.addClass('hidden');
    }

    flashNotes(actives) {
        let self = this;

        actives.removeClass('hidden')
              .fadeOut(0)
              .fadeIn(100)
              .fadeOut(100)
              .fadeIn(100)
              .fadeOut(100)
              .fadeIn(100);

        setTimeout(function () {
            actives.addClass('hidden');
            self.currentNoteJqElem.removeClass('hidden');
        }, 1000);
    }

    // each time the seeker selectors are
    // clicked the active notes are updated
    getActiveNotes() {
        // ACTIVE SECTIONS
        let sectionArray = [];
        // search for selected section bars
        let selectedSections = $('.seeker.section.selected');
        // if no sections selected, use all
        if (selectedSections.length === 0) {
            sectionArray = ['sec1', 'sec2', 'sec3'];
        } else {
            selectedSections.each(function () {
                sectionArray.push($(this).data('seeker'));
            });
        }

        // ACTIVE STRINGS
        let stringsArray = [];
        // search for selected section bars
        let selectedStrings = $('.seeker.tnote.selected');
        // if no strings selected, use all
        if (selectedStrings.length === 0) {
            stringsArray = ['str1', 'str2', 'str3', 'str4', 'str5', 'str6'];
        } else {
            selectedStrings.each(function () {
                stringsArray.push($(this).data('seeker'));
            });
        }

        // build the jquery search string
        let seekerArray = [];
        sectionArray.forEach(function (secStr) {
            stringsArray.forEach(function (strStr) {
                seekerArray.push('.note.' + secStr + '.' + strStr + '.natural');
            });
        });

        // its an array, make is a useful string
        let seekerString = seekerArray.toString();
        // use it
        let searchResult = $(seekerString);
        // convert jq object to an array
        let actives = searchResult.toArray();

        // let user know what's changed
        this.flashNotes(searchResult);

        // shuffle the new array
        this.duplicateAndShuffle(actives);
    }

    // utility method
    shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    // ONLY called fom getActiveNotes()
    duplicateAndShuffle(actives) {
        // store it
        this.currentActiveNotes = actives;
        // make a copy to shuffle so 
        // we don't change the original
        let arrCopy = this.currentActiveNotes.slice(0);
        // shuffle and store it
        this.currentShuffledNotes = this.shuffleArray(arrCopy);
        // make a copy of the shuffled array
        this.currentShuffledNotesCopy = arrCopy.slice(0);
    }

    removeIncorrectStatus() {
        // sometimes this one breaks
        // this.currentNoteJqElem.removeClass('incorrect');
        $('.incorrect').removeClass('incorrect');
    }

    // attached to the buttons
    checkNoteClick(note) {
        if (note === this.currentNote) {
            // notes are 1.5vw high and wide
            // convert that to pixels to get
            // to the middle of the div
            let halfDim = (1.5 * this.vwToPx) / 2;
            let offset = this.currentNoteJqElem.offset();
            Exploder.locExplode(offset.left + halfDim, offset.top + halfDim);
            // restoring 'hidden' status
            this.currentNoteJqElem.addClass('hidden');
            // and go again
            this.showANote();
        } else {
            // display a brief color change with the 'incorrect' class
            this.currentNoteJqElem.addClass('incorrect');
            // remove that after 1 second
            setTimeout(this.removeIncorrectStatus.bind(this), 1000);
        }
    }

    showANote() {
        // reset the notes array if shift has emptied it
        if (this.currentShuffledNotes.length === 0) {
            this.currentShuffledNotes = this.shuffleArray(this.currentShuffledNotesCopy.slice(0));
        }
        // pop the first not off as the new active
        // this removes notes one at a time to keep
        // from repeating the same note with a random method
        let currentItem = this.currentShuffledNotes.shift();
        // store the jquery element as currentNoteJqElem
        this.currentNoteJqElem = $(currentItem);
        // show it by removing the hidden class
        this.currentNoteJqElem.removeClass('hidden');
        // get the text (note) value of the current note
        this.currentNote = this.currentNoteJqElem.text();
    }

    setSectionNotesToArrays() {
        // getting all of the note elements for random targets, it will probably
        // be helpful to offer limits such as limited number of frets
        // (first six, second six, etc) as the notes are fairly easy to memorize
        // in sections
        this.sectionNotes['section1'] = $('#notes .sec1 .note.natural');
        this.sectionNotes['section2'] = $('#notes .sec2 .note.natural');
        this.sectionNotes['section3'] = $('#notes .sec3 .note.natural');
    }

    getTunings() {
        // gets the tuning notes over on the left and keeps them in order of the
        // elements so top to bottom and that works with string numbers.  this
        // gives the ability to easily change the tuning later and it doesn't
        // effect the existing code
        return $.map($('#tunings .tnote'), $.text);
    }

    // this needs to be called when the sections or tuning changes
    setNotes() {
        this.getFretNotes();
        this.setFretNotes();
    }

    getFretNotes() {
        // this uses the tuning notes on the left to determine
        // the notes for each fret.  not used atm but this
        // enables the ability to easily change the guitar tuning.
        // make an array of arrays for the notes on each fret
        this.keyNotes.forEach(function (item, index, arr) {
            // item is the tuning note for the string so here searching for the
            // first occurence of it and then grab the next 16 notes from the
            // notes array.  this.fretNotes ends as an array of 16 arrays each
            // containing an array of six notes for each fret
            let tIndex = this.notes.indexOf(item);
            let tNotes = this.notes.slice(tIndex + 1, tIndex + 17);
            this.fretNotes[0].push(tNotes[0]);
            this.fretNotes[1].push(tNotes[1]);
            this.fretNotes[2].push(tNotes[2]);
            this.fretNotes[3].push(tNotes[3]);
            this.fretNotes[4].push(tNotes[4]);
            this.fretNotes[5].push(tNotes[5]);
            this.fretNotes[6].push(tNotes[6]);
            this.fretNotes[7].push(tNotes[7]);
            this.fretNotes[8].push(tNotes[8]);
            this.fretNotes[9].push(tNotes[9]);
            this.fretNotes[10].push(tNotes[10]);
            this.fretNotes[11].push(tNotes[11]);
            this.fretNotes[12].push(tNotes[12]);
            this.fretNotes[13].push(tNotes[13]);
            this.fretNotes[14].push(tNotes[14]);
            this.fretNotes[15].push(tNotes[15]);
        }, this);
    }

    markPitchClass(noteElement, note) {
        if (note.indexOf('b') !== -1) {
            noteElement.addClass('accidental');
        } else {
            noteElement.addClass('natural');
        }
    }

    setFretNotes() {
        // loop through the 16 frets and then the 6
        // strings of that fret and place the note name
        // item is an array of six notes
        // index if the fret number
        // arr is the master array of the sixteen fret
        // arrays and their six note array
        this.fretNotes.forEach(function (item, index, arr) {
            let ns0 = $(this.frets[index]).find('.str1');
            ns0.text(item[0]);
            this.markPitchClass(ns0, item[0]);
            let ns1 = $(this.frets[index]).find('.str2');
            ns1.text(item[1]);
            this.markPitchClass(ns1, item[1]);
            let ns2 = $(this.frets[index]).find('.str3');
            ns2.text(item[2]);
            this.markPitchClass(ns2, item[2]);
            let ns3 = $(this.frets[index]).find('.str4');
            ns3.text(item[3]);
            this.markPitchClass(ns3, item[3]);
            let ns4 = $(this.frets[index]).find('.str5');
            ns4.text(item[4]);
            this.markPitchClass(ns4, item[4]);
            let ns5 = $(this.frets[index]).find('.str6');
            ns5.text(item[5]);
            this.markPitchClass(ns5, item[5]);
        }, this);
    }
}