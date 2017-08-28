/*
 * This mapping is still being worked on and is not finished.
 * Author: Prism with help from Be, deresh, and msweeney.
 * Mod by rootzoll
 * Mixxx Version: 2.0.0+
 * System: Ubuntu 15.04
 * 
 * For discussion on AMX
 * @see https://www.mixxx.org/forums/viewtopic.php?f=7&t=7514
 * 
 * For available mixxx controls
 * @see https://www.mixxx.org/wiki/doku.php/mixxxcontrols
 * --> 
 * 
 */

var AMX = {
    SEARCH_STEP: 0.05,
    SEARCH_STEP_FINE: 0.01,

    GAIN_STEP: 0.05,

    masterVuMeters: {
        'VuMeterL': {'ch': 0xB0, 'midino': 0x3E},
        'VuMeterR': {'ch': 0xB0, 'midino': 0x3F}
    },

    channelVuMeters: {
        '[Channel1]': {'ch': 0xB0, 'midino': 0x40},
        '[Channel2]': {'ch': 0xB0, 'midino': 0x41}
    },

    playLeds: {
        '[Channel1]': {'ch': 0x90, 'midino': 0x0A},
        '[Channel2]': {'ch': 0x90, 'midino': 0x0B}
    },

    cueLeds: {
        '[Channel1]': {'ch': 0x90, 'midino': 0x08},
        '[Channel2]': {'ch': 0x90, 'midino': 0x09}
    },

    activeModes: {
        shift: false,
        search1: false,
        search2: false,
        browseMain: true,
        tempPitchUpTimer : null,
        tempPitchDownTimer : null
    },

    decks: [
        '[Channel1]',
        '[Channel2]'
    ],

    init: function() {
        //connect Vumeters
        engine.connectControl('[Master]', 'VuMeterL', 'AMX.volumeLEDs');
        engine.connectControl('[Master]', 'VuMeterR', 'AMX.volumeLEDs');
        engine.connectControl('[Channel1]', 'VuMeter', 'AMX.volumeLEDs');
        engine.connectControl('[Channel2]', 'VuMeter', 'AMX.volumeLEDs');
        engine.connectControl('[Channel1]', 'play_indicator', 'AMX.indicators');
        engine.connectControl('[Channel2]', 'play_indicator', 'AMX.indicators');

	    engine.setValue('[Channel1]', 'orientation', 1);
        engine.setValue('[Channel2]', 'orientation', 1);
            
	    engine.setValue('[Channel1]', 'quantize', 1);
	    engine.setValue('[Channel2]', 'quantize', 1);

        midi.sendShortMsg(0x90,0x06,0x00); //Sync Channel 1 
        midi.sendShortMsg(0x90,0x07,0x00); //Sync Channel 2
        midi.sendShortMsg(0x90,0x0C,0x00); //PFL Channel 1
        midi.sendShortMsg(0x90,0x0D,0x00); //PFL Channel 2
        midi.sendShortMsg(0x90,0x04,0x00); //Load Track Channel 1
        midi.sendShortMsg(0x90,0x05,0x00); //Load Track Channel 2
        midi.sendShortMsg(0x90,0x08,0x00); //Cue Channel 1
        midi.sendShortMsg(0x90,0x09,0x00); //Cue Channel 2
        midi.sendShortMsg(0x90,0x0A,0x00); //Play Channel 1
        midi.sendShortMsg(0x90,0x0B,0x00); //Play Channel 2
        midi.sendShortMsg(0x90,0x19,0x00); //Touch Button
        midi.sendShortMsg(0x90,0x0C,0x00); //PFL Channel 1
        midi.sendShortMsg(0x90,0x0D,0x00); //PFL Channel 2
    },

    shutdown: function() {
        // clear Vu meter LEDs
        var masterVu = AMX.masterVuMeters;
        var channelVu = AMX.channelVuMeters;
        var deck1 = AMX.decks[0];
        var deck2 = AMX.decks[1];

        midi.sendShortMsg(masterVu.VuMeterL.ch, masterVu.VuMeterL.midino, 0);
        midi.sendShortMsg(masterVu.VuMeterR.ch, masterVu.VuMeterR.midino, 0);
        midi.sendShortMsg(channelVu[deck1].ch, channelVu[deck1].midino, 0);
        midi.sendShortMsg(channelVu[deck2].ch, channelVu[deck2].midino, 0);

        midi.sendShortMsg(0x90,0x06,0x00); //Sync Channel 1 
        midi.sendShortMsg(0x90,0x0D,0x00); //PFL Channel 2
        midi.sendShortMsg(0x90,0x04,0x00); //Load Track Channel 1
        midi.sendShortMsg(0x90,0x05,0x00); //Load Track Channel 2
        midi.sendShortMsg(0x90,0x08,0x00); //Cue Channel 1
        midi.sendShortMsg(0x90,0x09,0x00); //Cue Channel 2
        midi.sendShortMsg(0x90,0x0A,0x00); //Play Channel 1
        midi.sendShortMsg(0x90,0x0B,0x00); //Play Channel 2
        midi.sendShortMsg(0x90,0x01,0x00); //Pannel Button
        midi.sendShortMsg(0x90,0x19,0x00); //Touch Button
        midi.sendShortMsg(0x90,0x0C,0x00); //PFL Channel 1
        midi.sendShortMsg(0x90,0x0D,0x00); //PFL Channel 2
    },

    toggleMode: function(mode) {
        AMX.activeModes[mode] = !AMX.activeModes[mode];
        print(mode + ' mode: ' + AMX.activeModes[mode]);
    },

    volumeLEDs: function(value, group, control) {
        value *= 85;
        var ch, midino;

        if (group === '[Master]') {
            ch = AMX.masterVuMeters[control].ch;
            midino = AMX.masterVuMeters[control].midino;
        } else {
            ch = AMX.channelVuMeters[group].ch;
            midino = AMX.channelVuMeters[group].midino;
        }
        midi.sendShortMsg(ch, midino, value);
    },

    indicators: function(value, group, control) {
        if (control === 'play_indicator') {
            midi.sendShortMsg(AMX.playLeds[group].ch, AMX.playLeds[group].midino, value);
        }
        if (control === 'cue_indicator') {
            midi.sendShortMsg(AMX.cueLeds[group].ch, AMX.cueLeds[group].midino, value);
        }
    },

    browseTracks: function(group, selectPrevious) {
        var action = (selectPrevious) ? 'SelectPrevTrack' : 'SelectNextTrack';
        engine.setValue(group, action, 1);
    },      
      
    browseSidebar: function(group, selectPrevious) {
        var action = (selectPrevious) ? 'SelectPrevPlaylist' : 'SelectNextPlaylist';
        engine.setValue(group, action, 1);
    },

    toggleSelectedDirectory: function() {
        engine.setValue('[Playlist]', 'ToggleSelectedSidebarItem', 1);
    },

    stepPlayPosition: function(group, isSmallStep, decreasing) {
        var action = (decreasing) ? 'loop_move_1_backward' : 'loop_move_1_forward';
        engine.setValue(group, action, 1);
    },

    seekPosition: function(group, decreasing) {
        var action = "playposition";
        var actualPlayposition = engine.getValue(group, action);
        var value = (decreasing) ? actualPlayposition-0.0001 : actualPlayposition+0.0001;
        engine.setValue(group, action, value);
    },

    killTempPitchUp: function(group){
        AMX.activeModes.tempPitchUpTimer=null;
        engine.setValue(group, "rate_temp_up", 0);
    },

    killTempPitchDown: function(group){
        AMX.activeModes.tempPitchDownTimer=null;
        engine.setValue(group, "rate_temp_down", 0);
    },

    pitchPosition: function(group, decreasing) {
        
        if (decreasing) {

            // TEMP PITCH UP
            if (AMX.activeModes.tempPitchDownTimer!=null) AMX.killTempPitchDown(group);

            if (AMX.activeModes.tempPitchUpTimer==null) {
                // start new timer
                engine.setValue(group, "rate_temp_up", 1);
            } else {
                // cancel previous timer
                engine.stopTimer(AMX.activeModes.tempPitchUpTimer);
            }
            AMX.activeModes.tempPitchUpTimer = engine.beginTimer(100, "AMX.killTempPitchUp(\""+group+"\")", true);

        } else {

            // TEMP PITCH DOWN
            if (AMX.activeModes.tempPitchUpTimer!=null) AMX.killTempPitchUp(group);

            if (AMX.activeModes.tempPitchDownTimer==null) {
                // start new timer
                engine.setValue(group, "rate_temp_down", 1);
            } else {
                // cancel previous timer
                engine.stopTimer(AMX.activeModes.tempPitchDownTimer);
            }
            AMX.activeModes.tempPitchDownTimer = engine.beginTimer(100, "AMX.killTempPitchDown(\""+group+"\")", true);

        }
    },  

    stepGain: function(group, decreasing) {
        var action = (decreasing) ? 'beatjump_1_backward' : 'beatjump_1_forward';
        engine.setValue(group, action, 1);
    },

    stepRate: function(group, decreasing) {
        var action = (decreasing) ? 'rate_down_small' : 'rate_up_small';
        engine.setValue(group, action, 1);
    },

    // Event handlers (prefixed with "on") are mapped from `Akai-AMX.midi.xml`.

    onXFaderCurveTwist: function(channel, control, value) {
        script.crossfaderCurve(value, 0, 127);
    },

    onGainTwist: function(channel, control, value, status, group) {
        
        // The `value` can vary slightly depending on knob twist speed;
        // but it always above 100 if going backward (usually 127).
        var isLeftTwist = (value > 100);

        // detect is deck is playing
        var isPlaying = engine.getValue(group, "play") === 1;

        // Use gain knob for pitch control when shift is pressed.
        if (!AMX.activeModes.shift) {
            AMX.stepGain(group, isLeftTwist);
        } else {
            // on SHIFT
            if (isPlaying) {
                // up and down tempo to align tracks 
                AMX.pitchPosition(group, isLeftTwist);
            } else {
                // if not playing than seek detail position on deck 
                AMX.seekPosition(group, isLeftTwist);
            }
        }
    },

    onBrowseTwist: function(channel, control, value, status, group) {
        // Search on scroll if either search button is pressed. 
        var search1 = AMX.activeModes.search1;
        var search2 = AMX.activeModes.search2;
        var goLeft = (value === 127);

        // Search current track if either search button is pressed.
        if (search1 || search2) {
            var shift = (AMX.activeModes.shift);
            search1 && AMX.stepPlayPosition(AMX.decks[0], shift, goLeft);
            search2 && AMX.stepPlayPosition(AMX.decks[1], shift, goLeft);
        // Browse through tracks and directories.
        } else if (!AMX.activeModes['shift']) {
            AMX.browseTracks(group, goLeft);
        } else {
            AMX.browseSidebar(group, goLeft);
        }
    },

    onBrowsePress: function(channel, control, value, status, group) {
        if (AMX.activeModes['shift']) {
            // SHIFT pressed
            /* User is browsing the sidebar when Shift is pressed.
            * Pressing the Browserknob should open or close a point
            * in a sidebar. 
            */
            engine.setValue("[Playlist]", "ToggleSelectedSidebarItem", 1);
        } else {
            // NORMAL
            /* When Browse Knob is pressed the actual selected track gets  
            * loaded into the preview section and gets played.
            * If track is already playing it justs stops that track.
            */
            if (engine.getParameter(group, "play")==1) {
                engine.setParameter(group, "play", 0);
            } else {
                engine.setParameter(group, "LoadSelectedTrackAndPlay", 1);
            }
        }

    },

    onShiftPress: function() {
        AMX.toggleMode('shift');
    },

    onSearchPress: function(channel, control, value) {
        var button = (control === 2) ? 'search1' : 'search2';
        AMX.toggleMode(button);
    },

    crossfaderSwitch: function(channel, control, value) {
    if (value){
	        engine.setValue('[Channel1]', 'orientation', 0);
        	engine.setValue('[Channel2]', 'orientation', 2);
	} else {
	        engine.setValue('[Channel1]', 'orientation', 1);
        	engine.setValue('[Channel2]', 'orientation', 1);
	}
    },

    syncPressed: function(channel, control, value, status, group) {
        // Normal Sync is handled by XML directly
        // Make sure to also beatgrid align the tracks on sync
        engine.setParameter(group, "beats_translate_match_alignment", 1);
    },

    loopPressed: function(channel, control, value, status, group) {

            /* CUE is the new ONE BUTTON LOOP
            * 1. Press sets In-loop-Marker
            * 2. Press sets Out-loop-Marker and activated loop
            * 3. Press deaktivated loop and deletes loop markers
            * --> to undo a step, use GUI
            */

            if (engine.getParameter(group, "loop_out")==1) {
                // 3. Press
                engine.setParameter(group, "loop_out", 0); 
                engine.setParameter(group, "loop_in", 0); 
                engine.setParameter(group, "reloop_exit", 1); 
                if (group=="[Channel1]") midi.sendShortMsg(0x90,0x08,0x00);
                if (group=="[Channel2]") midi.sendShortMsg(0x90,0x09,0x00);
            } else
            if (engine.getParameter(group, "loop_in")==1) {
                // 2. Press
                engine.setParameter(group, "loop_out", 1);  
                if (group=="[Channel1]") midi.sendShortMsg(0x90,0x08,0x7f);
                if (group=="[Channel2]") midi.sendShortMsg(0x90,0x09,0x7f);
            } else {
                // 1. Press
                engine.setParameter(group, "loop_in", 1);  
            }
            
    }
};
