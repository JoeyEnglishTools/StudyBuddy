// Comprehensive Cache-Busting Script
(function() {
    // Static build version - update this when making changes
    const BUILD_VERSION = '2025-07-25-v1.2.1';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    console.log('Cache-busting applied with timestamp:', timestamp, 'randomId:', randomId);

    // Clear all types of browser cache
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
                console.log('Unregistered service worker');
            }
        });
    }

    // Clear application cache (deprecated but still used by some browsers)
    if ('applicationCache' in window) {
        try {
            window.applicationCache.swapCache();
            console.log('Application cache swapped');
        } catch(e) {
            console.log('Application cache not available');
        }
    }

    // Add cache-busting to current URL if not already present
    if (!window.location.search.includes('cb=')) {
        const separator = window.location.search ? '&' : '?';
        const newUrl = window.location.href + separator + 'cb=' + timestamp + '_' + randomId;
        history.replaceState(null, '', newUrl);
    }

    // Force hard reload with specific key combination hint
    const showCacheWarning = () => {
        if (sessionStorage.getItem('cacheWarningShown') !== 'true') {
            console.warn('🔄 CACHE NOTICE: If you see old content, press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac) to force refresh');
            sessionStorage.setItem('cacheWarningShown', 'true');
        }
    };

    // Add meta tag with build version
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'app-version');
    meta.setAttribute('content', BUILD_VERSION);
    document.head.appendChild(meta);

    // Show cache warning after page loads
    window.addEventListener('load', showCacheWarning);

    // Clear localStorage cache indicators on unload
    window.addEventListener('beforeunload', () => {
        try {
            // Clear any cached flags
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb_cache_') || key.startsWith('studybuddy_cache_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch(e) {
            console.log('LocalStorage cleanup skipped');
        }
    });

})();

document.addEventListener('DOMContentLoaded', () => {     

    // Initialize cache status display
    const initializeCacheStatus = () => {
        const versionDisplay = document.getElementById('appVersionDisplay');
        const refreshButton = document.getElementById('forceCacheRefresh');
        const buildVersion = document.querySelector('meta[name="app-version"]')?.content || 'Unknown';

        if (versionDisplay) {
            versionDisplay.textContent = buildVersion;
        }

        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                console.log('Force refresh requested by user');
                // Clear all storage
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch(e) {
                    console.log('Storage clear failed:', e);
                }
                // Force hard reload
                window.location.reload(true);
            });
        }
    };

    initializeCacheStatus();

    // --- REPLACEMENT: Supabase Client Setup ---
    let supabaseClient = null;

    try {
        const SUPABASE_URL = 'https://yxngigimphtfoslzmksn.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdpZ2ltcGh0Zm9zbHpta3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjk2NDUsImV4cCI6MjA2ODYwNTY0NX0.c4b45vxCOnmLV6VY7w0DsPr2cAzRf9zNbqaXkKaWmYQ';
        
        // Create client directly
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Test client immediately
        console.log('Supabase client initialized:', !!supabaseClient);
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
    }
    
    // --- REPLACEMENT: Database Testing and Fetch Notes Functions ---
    async function testDatabaseConnection() {
        console.log('🧪 Testing database connection...');
        
        try {
            // 1. Verify Supabase client
            if (!supabaseClient) {
                console.error('❌ Supabase client not available');
                return false;
            }
            
            // 2. Get authenticated user
            const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
            if (userError || !user) {
                console.error('❌ Authentication error:', userError || 'No user found');
                return false;
            }
            console.log('✅ Authenticated as:', user.email);
            
            // 3. Test a simple query
            console.log('📡 Testing direct database query...');
            const { data, error } = await supabaseClient
                .from('notes')
                .select('count')
                .limit(1);
                
            if (error) {
                console.error('❌ Database error:', error);
                return false;
            }
            
            console.log('✅ Database connection successful:', data);
            return true;
        } catch (err) {
            console.error('💥 Unexpected error during test:', err);
            return false;
        }
    }

    // Replace the original fetchNotes function with this simplified version
  // Enhanced fetchNotes function with guaranteed data population
async function fetchNotes() {
  console.log('🔍 FETCH STARTED: Beginning data fetch process');
  
  try {
    // 1. Verify Supabase client is available
    if (!supabaseClient) {
      console.error('❌ No Supabase client available');
      vocabulary = [];
      return false;
    }
    
    // 2. Get the authenticated user with extra validation
    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
      console.error('❌ Authentication error:', authError);
      vocabulary = [];
      return false;
    }
    
    const user = authData?.user;
    if (!user || !user.id) {
      console.error('❌ No valid user found in auth data:', authData);
      vocabulary = [];
      return false;
    }
    
    console.log('✅ User authenticated:', user.id, user.email);
    
    // 3. Perform database query with explicit timeout handling
    console.log('📡 Querying database for notes...');
    
    // Create a timeout promise to handle stalled queries
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timed out after 10 seconds')), 10000)
    );
    
    // Create the actual query
    const queryPromise = supabaseClient
      .from('notes')
      .select('term, definition, term_lang, created_at')
      .eq('user_id', user.id);
    
    // Race the query against the timeout
    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('❌ Database error:', error);
      vocabulary = [];
      return false;
    }
    
    // 4. Validate the returned data
    if (!data) {
      console.error('❌ No data returned from query');
      vocabulary = [];
      return false;
    }
    
    console.log('📊 Raw data received:', data);
    
    // 5. Explicitly check the data structure
    if (!Array.isArray(data)) {
      console.error('❌ Data is not an array:', typeof data);
      vocabulary = [];
      return false;
    }
    
    // 6. Map data with explicit property checks
    console.log(`📝 Processing ${data.length} notes...`);
    
    const mappedVocabulary = data.map((note, index) => {
      // Validate each note has required fields
      if (!note.term || !note.definition) {
        console.warn(`⚠️ Note at index ${index} is missing required fields:`, note);
        return null;
      }
      
      return {
        lang1: note.term,
        lang2: note.definition,
        term_lang: note.term_lang || 'en-GB', // Include language info
        created_at: note.created_at, // Include timestamp for filtering
        originalIndex: index,
        correctCount: 0
      };
    }).filter(item => item !== null); // Remove any invalid notes
    
    // 7. CRUCIAL: Explicitly assign to global vocabulary
    console.log(`✅ Successfully mapped ${mappedVocabulary.length} vocabulary items`);
    
    window.vocabulary = mappedVocabulary; // Ensure global assignment
    vocabulary = mappedVocabulary; // Local assignment
    
    // 8. Set language from first note if available
    if (data.length > 0 && data[0].term_lang) {
      csvUploadedTargetLanguage = data[0].term_lang;
      console.log('🌐 Set language to:', csvUploadedTargetLanguage);
    }
    
    // 9. Verify the vocabulary array is actually populated
    console.log('🔍 FINAL VERIFICATION:', {
      vocabularyLength: vocabulary.length,
      isArray: Array.isArray(vocabulary),
      sampleItems: vocabulary.slice(0, 2)
    });
    
    return vocabulary.length > 0;
  } catch (err) {
    console.error('💥 Unexpected error in fetchNotes:', err);
    console.error('Stack trace:', err.stack);
    
    // Try to recover with a direct global assignment
    try {
      window.vocabulary = [];
      vocabulary = [];
    } catch (e) {
      console.error('Failed to reset vocabulary array:', e);
    }
    
    return false;
  }
}

    // --- SESSION MANAGEMENT ---
    async function enforceSignOutOtherDevices() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;
            
            const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const userLogin = user.email?.split('@')[0] || 'user';
            const newSessionId = `${userLogin}_${Date.now().toString()}_${Math.random().toString(36).substring(2)}`;
            
            console.log('🔐 Enforcing sign out on other devices for user:', user.id);
            console.log('🔐 New session ID:', newSessionId);
            
            // Check if there's an existing active session
            const { data: existingProfile } = await supabaseClient
                .from('profiles')
                .select('active_session_id, last_active')
                .eq('id', user.id)
                .single();
            
            const hasOtherActiveSession = existingProfile && 
                existingProfile.active_session_id && 
                existingProfile.active_session_id !== localStorage.getItem('current_session_id');
            
            if (hasOtherActiveSession) {
                // Show non-rigid message about other sessions
                const lastActiveTime = existingProfile.last_active ? 
                    new Date(existingProfile.last_active).toLocaleString() : 'unknown time';
                
                alert(`📱 Multi-Device Login Detected\n\nYou have other login sessions open on different devices.\nLast activity: ${lastActiveTime}\n\nThose sessions will be automatically disabled to ensure proper app functionality. You can continue using StudyBuddy normally on this device.`);
            }
            
            // Update the profiles table with new session info
            const { error } = await supabaseClient
                .from('profiles')
                .update({ 
                    active_session_id: newSessionId,
                    last_active: currentDate,
                    username: userLogin
                })
                .eq('id', user.id);
                
            if (error) {
                console.error('Failed to update profile session:', error);
                return false;
            }
            
            // Store session ID locally
            localStorage.setItem('current_session_id', newSessionId);
            console.log('✅ Session enforcement completed successfully');
            return true;
        } catch (err) {
            console.error('Failed to enforce sign out on other devices:', err);
            return false;
        }
    }

    async function validateSessionIsActive() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return false;
            
            // Get current session ID from local storage
            const currentSessionId = localStorage.getItem('current_session_id');
            if (!currentSessionId) {
                console.log('⚠️ No local session ID found');
                return false;
            }
            
            // Check if this session is still active in the database
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('active_session_id')
                .eq('id', user.id)
                .single();
                
            if (error) {
                console.error('Failed to validate session:', error);
                return false;
            }
            
            const isValid = data && data.active_session_id === currentSessionId;
            if (!isValid) {
                console.log('❌ Session is no longer valid - another device has logged in');
                // Force logout
                await supabaseClient.auth.signOut();
                localStorage.removeItem('current_session_id');
                return false;
            }
            
            console.log('✅ Session is valid');
            return true;
        } catch (err) {
            console.error('Error validating session:', err);
            return false;
        }
    }

    function setupSessionValidation() {
        // Check session validity every 3 minutes
        setInterval(async () => {
            // Only check if user is logged in
            const { data } = await supabaseClient.auth.getSession();
            if (data.session) {
                await validateSessionIsActive();
            }
        }, 180000); // 180 seconds (3 minutes)
        
        console.log('✅ Session validation setup completed');
    }

    // --- STATE & CONSTANTS ---
    const MAX_MISTAKES = 3, FAST_ANSWER_THRESHOLD = 5e3, POINTS_CORRECT_TALK_TO_ME = 5, POINTS_FAST_CORRECT = 10, POINTS_SLOW_CORRECT = 5, POINTS_INCORRECT = -10, ITEMS_PER_PART = 32, ITEMS_PER_SUB_ROUND = 8, MAX_GAME_ITEMS_FILL_BLANKS = 10, TEXT_TRUNCATE_LENGTH = 60, MAX_FIND_WORDS_ROUNDS = 5, WORDS_PER_FIND_WORDS_DISPLAY = 8, WORDS_PER_FIND_WORDS_TARGET = 3, FIND_WORDS_REQUIRED_VOCAB = 15;
    let vocabulary = [], csvUploadedTargetLanguage = "en-GB", activeTargetStudyLanguage = "en-GB", recognition, isListening = false, isSignUp = false, isAuthenticating = false;
    
    // Helper function to check if user has already defined a learning language
    function hasDefinedLanguage() {
        const storedLanguage = localStorage.getItem('learning_language');
        const keepPreference = localStorage.getItem('live_notes_keep_preference') === 'true';
        
        // User has defined a language if:
        // 1. They uploaded CSV with language selection, OR
        // 2. They used Live Notes and chose to keep the preference
        return (csvUploadedTargetLanguage && csvUploadedTargetLanguage !== 'en-GB') || 
               (storedLanguage && keepPreference);
    }
    
    // Helper function to get the current active language
    function getCurrentActiveLanguage() {
        const storedLanguage = localStorage.getItem('learning_language');
        const keepPreference = localStorage.getItem('live_notes_keep_preference') === 'true';
        
        if (csvUploadedTargetLanguage && csvUploadedTargetLanguage !== 'en-GB') {
            return csvUploadedTargetLanguage;
        } else if (storedLanguage && keepPreference) {
            return storedLanguage;
        }
        return 'en-GB'; // Default
    }
    let currentVocabularyPart = [], currentPartName = "", mistakesRemaining = 3, currentScore = 0, sessionMaxScore = 0;
    let isEssentialsMode = false, currentEssentialsCategoryName = "";
    let audioInitialized = false;
    let mcqAnswered = false, typeTranslationAnswered = false, fillBlanksAnswered = false;
    let currentMcqIndex = 0, currentTypeTranslationIndex = 0, currentFillBlanksIndex = 0;
    let findWordsSessionPool = [], currentFindWordsRound = 0, findWordsCurrentChoices = [], findWordsTargetWords = [], findWordsSelectedWords = [];
    let selectedMatchCard = null, matchedPairs = 0, pairsToMatch = 0;
    
    // Live Notes state
    let liveNotesData = [], notepadContent = '', autoSaveTimer = null, autoSaveCountdown = 300, pendingChanges = false;
    let autoAdvanceTimer = null; // Timer for 7-second auto-advance
    let currentTranslationSuggestion = null; // Store current translation suggestion
    let translationTimeout = null; // Timeout for translation requests

    // --- ELEMENT SELECTORS ---
    const loginSection = document.getElementById('loginSection'), appContent = document.getElementById('appContent'), logoutBtn = document.getElementById('logoutBtn'), googleLoginBtn = document.getElementById('googleLoginBtn'), authForm = document.getElementById('authForm'), authTitle = document.getElementById('authTitle'), authSubmitBtn = document.getElementById('authSubmitBtn'), authToggleText = document.getElementById('authToggleText'), authError = document.getElementById('authError'), addNotesBtn = document.getElementById('addNotesBtn'), refreshVocabBtn = document.getElementById('refreshVocabBtn'), liveNotesBtn = document.getElementById('liveNotesBtn');
    
    // Live Notes elements
    const liveNotesModal = document.getElementById('liveNotesModal'), liveNotesContainer = document.getElementById('liveNotesContainer'), closeLiveNotesBtn = document.getElementById('closeLiveNotesBtn'), liveNotesTextarea = document.getElementById('liveNotesTextarea'), liveNotesLanguageSelector = document.getElementById('liveNotesLanguageSelector'), newLineBtn = document.getElementById('newLineBtn'), previousLineBtn = document.getElementById('previousLineBtn'), clearAllBtn = document.getElementById('clearAllBtn'), manualSaveBtn = document.getElementById('manualSaveBtn'), saveStatus = document.getElementById('saveStatus'), lineCount = document.getElementById('lineCount'), parsedCount = document.getElementById('parsedCount'), cloudIcon = document.getElementById('cloudIcon'), uploadArrow = document.getElementById('uploadArrow');
    const mainSelectionSection = document.getElementById("mainSelectionSection"), showUploadSectionBtn = document.getElementById("showUploadSectionBtn"), showEssentialsSectionBtn = document.getElementById("showEssentialsSectionBtn"), csvFileInput = document.getElementById("csvFile"), targetLanguageSelector = document.getElementById("targetLanguageSelector"), languageSelectorInGame = document.getElementById("languageSelectorInGame"), languageSelectionInGameContainer = document.getElementById("languageSelectionInGameContainer"), uploadBtn = document.getElementById("uploadBtn"), uploadStatus = document.getElementById("uploadStatus"), uploadSection = document.getElementById("uploadSection"), dropZone = document.getElementById("dropZone"), backToMainSelectionFromUploadBtn = document.getElementById("backToMainSelectionFromUploadBtn"), essentialsCategorySelectionSection = document.getElementById("essentialsCategorySelectionSection"), essentialsCategoryButtonsContainer = document.getElementById("essentialsCategoryButtonsContainer"), backToMainSelectionFromEssentialsBtn = document.getElementById("backToMainSelectionFromEssentialsBtn"), essentialsCategoryOptionsSection = document.getElementById("essentialsCategoryOptionsSection"), essentialsOptionsTitle = document.getElementById("essentialsOptionsTitle"), reviewEssentialsCategoryBtn = document.getElementById("reviewEssentialsCategoryBtn"), playGamesWithEssentialsBtn = document.getElementById("playGamesWithEssentialsBtn"), backToEssentialsCategoriesBtn = document.getElementById("backToEssentialsCategoriesBtn"), gameSelectionSection = document.getElementById("gameSelectionSection"), gameButtonsContainer = document.getElementById("gameButtonsContainer"), backToSourceSelectionBtn = document.getElementById("backToSourceSelectionBtn"), gameArea = document.getElementById("gameArea"), noVocabularyMessage = document.getElementById("noVocabularyMessage"), gameOverMessage = document.getElementById("gameOverMessage"), roundCompleteMessageDiv = document.getElementById("roundCompleteMessage"), bonusRoundCountdownMessageDiv = document.getElementById("bonusRoundCountdownMessage"), matchingBtn = document.getElementById("matchingBtn"), multipleChoiceBtn = document.getElementById("multipleChoiceBtn"), typeTranslationBtn = document.getElementById("typeTranslationBtn"), talkToMeBtn = document.getElementById("talkToMeBtn"), fillInTheBlanksBtn = document.getElementById("fillInTheBlanksBtn"), findTheWordsBtn = document.getElementById("findTheWordsBtn"), backToGameSelectionBtn = document.getElementById("backToGameSelectionBtn"), gameTitle = document.getElementById("gameTitle"), musicToggleBtn = document.getElementById("musicToggleBtn"), musicIconOn = document.getElementById("musicIconOn"), musicIconOff = document.getElementById("musicIconOff"), musicStatusText = document.getElementById("musicStatusText"), mistakeTrackerDiv = document.getElementById("mistakeTracker"), currentScoreDisplay = document.getElementById("currentScoreDisplay"), maxScoreDisplay = document.getElementById("maxScoreDisplay"), partSelectionContainer = document.getElementById("partSelectionContainer"), partButtonsContainer = document.getElementById("partButtonsContainer");
    const matchingGameContainer = document.getElementById("matchingGame"), matchingGrid = document.getElementById("matchingGrid"), matchingInstructions = document.getElementById("matchingInstructions"), matchingFeedback = document.getElementById("matchingFeedback"), resetCurrentPartBtn = document.getElementById("resetCurrentPartBtn"), multipleChoiceGameContainer = document.getElementById("multipleChoiceGame"), mcqInstructions = document.getElementById("mcqInstructions"), mcqQuestion = document.getElementById("mcqQuestion"), mcqOptions = document.getElementById("mcqOptions"), mcqFeedback = document.getElementById("mcqFeedback"), nextMcqBtn = document.getElementById("nextMcqBtn");
    const typeTranslationGameContainer = document.getElementById("typeTranslationGame"), typeTranslationInstructions = document.getElementById("typeTranslationInstructions"), typeTranslationPhrase = document.getElementById("typeTranslationPhrase"), typeTranslationInput = document.getElementById("typeTranslationInput"), hintTypeTranslationBtn = document.getElementById("hintTypeTranslationBtn"), typeTranslationHintDisplay = document.getElementById("typeTranslationHintDisplay"), checkTypeTranslationBtn = document.getElementById("checkTypeTranslationBtn"), typeTranslationFeedback = document.getElementById("typeTranslationFeedback"), nextTypeTranslationBtn = document.getElementById("nextTypeTranslationBtn"), typeTranslationCounter = document.getElementById("typeTranslationCounter");
    const fillInTheBlanksGameContainer = document.getElementById("fillInTheBlanksGame"), fillInTheBlanksInstructions = document.getElementById("fillInTheBlanksInstructions"), fillInTheBlanksSentence = document.getElementById("fillInTheBlanksSentence"), fillInTheBlanksInput = document.getElementById("fillInTheBlanksInput"), checkFillInTheBlanksBtn = document.getElementById("checkFillInTheBlanksBtn"), fillInTheBlanksFeedback = document.getElementById("fillInTheBlanksFeedback"), nextFillInTheBlanksBtn = document.getElementById("nextFillInTheBlanksBtn"), fillInTheBlanksCounter = document.getElementById("fillInTheBlanksCounter");
    const findTheWordsGameContainer = document.getElementById("findTheWordsGame"), findTheWordsInstructions = document.getElementById("findTheWordsInstructions"), replayFindTheWordsAudioBtn = document.getElementById("replayFindTheWordsAudioBtn"), findTheWordsRoundCounter = document.getElementById("findTheWordsRoundCounter"), findTheWordsGrid = document.getElementById("findTheWordsGrid"), sendFindTheWordsBtn = document.getElementById("sendFindTheWordsBtn"), findTheWordsFeedback = document.getElementById("findTheWordsFeedback"), nextFindTheWordsRoundBtn = document.getElementById("nextFindTheWordsRoundBtn"), talkToMeGameContainer = document.getElementById("talkToMeGame"), talkToMeInstructions = document.getElementById("talkToMeInstructions"), talkToMePhraseToRead = document.getElementById("talkToMePhraseToRead"), talkToMePhraseText = document.getElementById("talkToMePhraseText"), speakPhraseBtn = document.getElementById("speakPhraseBtn"), listenBtn = document.getElementById("listenBtn"), listenBtnText = document.getElementById("listenBtnText"), nextTalkToMeBtn = document.getElementById("nextTalkToMeBtn"), talkToMeRecognizedText = document.getElementById("talkToMeRecognizedText"), talkToMeFeedback = document.getElementById("talkToMeFeedback"), talkToMeReferenceContainer = document.getElementById("talkToMeReferenceContainer"), talkToMeReferenceLabel = document.getElementById("talkToMeReferenceLabel"), talkToMeReferenceDisplay = document.getElementById("talkToMeReferenceDisplay"), talkToMeCounter = document.getElementById("talkToMeCounter"), speechApiStatus = document.getElementById("speechApiStatus"), hearItOutLoudToggleBtn = document.getElementById("hearItOutLoudToggleBtn"), hearItOutLoudBtnText = document.getElementById("hearItOutLoudBtnText"), ttsGeneralStatus = document.getElementById("ttsGeneralStatus");

    // --- DATA ---
    const essentialsVocabularyData = { "Travel (EN-ES)": [{ lang1: "passport", lang2: "pasaporte", sentence: "You need a ____ to travel abroad.", correctCount: 0, originalIndex: 0 }, { lang1: "ticket", lang2: "billete", sentence: "I bought a round-trip ____ to Paris.", correctCount: 0, originalIndex: 1 }, { lang1: "luggage", lang2: "equipaje", sentence: "My ____ was too heavy.", correctCount: 0, originalIndex: 2 }, { lang1: "destination", lang2: "destino", sentence: "Our final ____ is Rome.", correctCount: 0, originalIndex: 3 }, { lang1: "reservation", lang2: "reserva", sentence: "I made a hotel ____ online.", correctCount: 0, originalIndex: 4 }], "Business (EN-ES)": [{ lang1: "meeting", lang2: "reunión", sentence: "The client ____ is at 2 PM.", correctCount: 0, originalIndex: 0 }, { lang1: "contract", lang2: "contrato", sentence: "Please review the ____ carefully.", correctCount: 0, originalIndex: 1 }, { lang1: "negotiation", lang2: "negociación", sentence: "The ____ lasted for hours.", correctCount: 0, originalIndex: 2 }, { lang1: "deadline", lang2: "fecha límite", sentence: "We must meet the project ____.", correctCount: 0, originalIndex: 3 }, { lang1: "presentation", lang2: "presentación", sentence: "She gave an excellent ____.", correctCount: 0, originalIndex: 4 }], "Food (EN-FR)": [{ lang1: "bread", lang2: "pain", sentence: "I would like some ____, please.", correctCount: 0, originalIndex: 0 }, { lang1: "water", lang2: "eau", sentence: "Can I have a glass of ____?", correctCount: 0, originalIndex: 1 }] };
    Object.values(essentialsVocabularyData).forEach(e => { e.forEach((e, t) => { if (e.originalIndex === undefined) e.originalIndex = t; if (e.correctCount === undefined) e.correctCount = 0; }) });

    // --- AUTHENTICATION & DATA FUNCTIONS ---
    function toggleAuthMode() {
        isSignUp = !isSignUp;
        authError.textContent = '';
        authForm.reset();
        authTitle.textContent = isSignUp ? 'Create a New Account' : 'Login to Your Account';
        authSubmitBtn.textContent = isSignUp ? 'Sign Up' : 'Login';
        authToggleText.innerHTML = isSignUp
            ? `Already have an account? <span class="toggle-auth-link">Login</span>`
            : `Don't have an account? <span class="toggle-auth-link">Sign Up</span>`;
    }

    function parseCSV(csvData) {
        const parsed = [];
        const lines = csvData.split(/\r\n|\n/);

        // Skip header row if it exists
        const startIndex = lines.length > 0 && lines[0].toLowerCase().includes('word') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;

            const parts = [];
            let currentField = '';
            let inQuotedField = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    if (inQuotedField && j + 1 < line.length && line[j + 1] === '"') {
                        currentField += '"';
                        j++; 
                    } else {
                        inQuotedField = !inQuotedField;
                    }
                } else if (char === ',' && !inQuotedField) {
                    parts.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            parts.push(currentField.trim()); 

            if (parts.length >= 2 && parts[0] && parts[1]) {
                parsed.push({
                    lang1: parts[0],
                    lang2: parts[1]
                });
            }
        }
        return parsed;
    }

    async function saveNotes(notesToSave) {
        console.log('💾 saveNotes: Called with', notesToSave.length, 'notes:', notesToSave);

        if (!supabaseClient) {
            console.error('❌ saveNotes: Supabase client not available');
            if (uploadStatus) {
                uploadStatus.textContent = 'Database connection not available.';
                uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
            }
            return false;
        }

        console.log('🔐 saveNotes: Getting user authentication...');
        
        const userResult = await supabaseClient.auth.getUser();
        
        console.log('🔐 saveNotes: User result:', { 
            userId: userResult?.data?.user?.id, 
            email: userResult?.data?.user?.email, 
            error: userResult?.error 
        });

        const user = userResult?.data?.user;
        if (!user) {
            console.error('❌ saveNotes: User not authenticated');
            if (uploadStatus) {
                uploadStatus.textContent = 'You must be logged in to save notes.';
                uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
            }
            return false;
        }

        try {
            const notesWithUser = notesToSave.map(note => ({
                user_id: user.id,
                term: note.lang1,
                definition: note.lang2,
                term_lang: (liveNotesLanguageSelector && !liveNotesModal?.classList.contains('hidden')) 
                          ? liveNotesLanguageSelector.value 
                          : csvUploadedTargetLanguage || 'en-GB',
                definition_lang: 'en'
            }));
            console.log('📊 saveNotes: Preparing to insert into Supabase:', notesWithUser.length, 'notes');
            console.log('📊 saveNotes: Sample note data:', notesWithUser.slice(0, 1));

            console.log('💾 saveNotes: Executing INSERT query...');
            const insertStartTime = Date.now();
            const { data, error } = await supabaseClient.from('notes').insert(notesWithUser);
            const insertDuration = Date.now() - insertStartTime;
            
            console.log('💾 saveNotes: INSERT completed in', insertDuration, 'ms');
            console.log('💾 saveNotes: Supabase insert result:', { data, error });

            if (error) {
                console.error('❌ saveNotes: Error saving notes:', error);
                console.error('❌ saveNotes: Error details:', JSON.stringify(error, null, 2));
                if (uploadStatus) {
                    uploadStatus.textContent = 'Error saving notes: ' + error.message;
                    uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
                }
                return false;
            }
            
            console.log('✅ saveNotes: Notes saved successfully');
            return true;
            
        } catch (err) {
            console.error('💥 saveNotes: Unexpected error saving notes:', err);
            console.error('💥 saveNotes: Error message:', err.message);
            console.error('💥 saveNotes: Error stack:', err.stack);
            if (uploadStatus) {
                uploadStatus.textContent = 'Unexpected error saving notes: ' + err.message;
                uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
            }
            return false;
        }
    }

    // --- LIVE NOTES FUNCTIONS ---
    async function initializeLiveNotes() {
        // Show modal first
        liveNotesModal.classList.remove('hidden');
        
        // Initialize Live Notes language selector AFTER showing modal
        await initializeLiveNotesLanguage();
        
        // Initialize auto-translate functionality
        await initializeAutoTranslate();
        
        // Try to restore previous Live Notes content from localStorage
        const savedContent = localStorage.getItem('live_notes_content');
        if (savedContent) {
            liveNotesTextarea.value = savedContent;
            notepadContent = savedContent;
            parseNotepadContent();
            console.log('📝 Restored Live Notes content from localStorage');
        } else {
            // Clear existing content if no saved content
            notepadContent = '';
            liveNotesData = [];
            liveNotesTextarea.value = '';
        }
        
        pendingChanges = false;
        
        // Add event listeners to notepad
        liveNotesTextarea.addEventListener('input', handleNotepadInput);
        liveNotesTextarea.addEventListener('keydown', handleNotepadKeydown);
        liveNotesTextarea.addEventListener('click', handleNotepadClick);
        
        // Initialize display counters and status
        updateLineAndParsedCounts();
        updateSaveStatus();
        
        // Start auto-save timer
        startAutoSaveTimer();
        
        // Focus on textarea
        liveNotesTextarea.focus();
    }
    
    function handleNotepadClick(event) {
        const textarea = event.target;
        const cursorPosition = textarea.selectionStart;
        const content = textarea.value;
        
        // Find the line where the user clicked
        const beforeCursor = content.substring(0, cursorPosition);
        const lines = content.split('\n');
        
        let charCount = 0;
        let clickedLineIndex = 0;
        let clickedLine = '';
        
        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (charCount + lineLength > cursorPosition) {
                clickedLineIndex = i;
                clickedLine = lines[i];
                break;
            }
            charCount += lineLength;
        }
        
        if (!clickedLine.trim()) return;
        
        // Normalize symbols in the line
        const normalizedLine = normalizeSymbolsInText(clickedLine);
        
        // Check if the line contains a dash separator
        const dashMatches = normalizedLine.match(/^(.+?)\s*[-–—]\s*(.+)$/);
        if (!dashMatches) return;
        
        const targetWord = dashMatches[1].trim();
        const positionInLine = cursorPosition - charCount;
        const dashIndex = normalizedLine.indexOf('-');
        
        // Check if user clicked on the target word (before the dash)
        if (positionInLine <= dashIndex && targetWord) {
            // Get the current language setting for pronunciation
            const languageSelector = document.getElementById('liveNotesLanguageSelector');
            const selectedLanguage = languageSelector ? languageSelector.value : 'en-GB';
            
            console.log('🔊 Speaking word from Live Notes:', targetWord, 'in language:', selectedLanguage);
            speakText(targetWord, selectedLanguage);
        }
    }
    
    async function initializeLiveNotesLanguage() {
        const liveNotesLanguageSelector = document.getElementById('liveNotesLanguageSelector');
        
        // Check if we have a stored learning language from CSV upload
        const storedLanguage = localStorage.getItem('learning_language');
        const keepPreference = localStorage.getItem('live_notes_keep_preference') === 'true';
        
        if (storedLanguage && keepPreference) {
            // Use the stored language and user wants to keep it
            liveNotesLanguageSelector.value = storedLanguage;
            console.log('🌐 Using stored learning language for Live Notes (kept preference):', storedLanguage);
        } else {
            // Show the Live Notes language selection modal on top
            try {
                const result = await showLiveNotesLanguageModal();
                liveNotesLanguageSelector.value = result.language;
                
                // Store the language and preference setting
                localStorage.setItem('learning_language', result.language);
                localStorage.setItem('live_notes_keep_preference', result.keepPreference.toString());
                
                console.log('🌐 Selected learning language for Live Notes:', result.language, 'Keep preference:', result.keepPreference);
            } catch (error) {
                if (error === 'cancelled') {
                    // User cancelled, close Live Notes
                    closeLiveNotes();
                    return;
                }
                console.error('Error selecting language:', error);
                // Fall back to default
                liveNotesLanguageSelector.value = 'en-GB';
            }
        }
    }
    
    async function initializeAutoTranslate() {
        const enableAutoTranslateCheckbox = document.getElementById('enableAutoTranslateCheckbox');
        
        // Check if auto-translate is enabled and if we have a stored preference
        const autoTranslateEnabled = localStorage.getItem('auto_translate_enabled') === 'true';
        const autoTranslateLanguage = localStorage.getItem('auto_translate_language');
        const neverAskAgain = localStorage.getItem('auto_translate_never_ask') === 'true';
        
        // Set checkbox state
        enableAutoTranslateCheckbox.checked = autoTranslateEnabled;
        
        // Add event listener for checkbox changes
        enableAutoTranslateCheckbox.addEventListener('change', async (event) => {
            const isEnabled = event.target.checked;
            
            if (isEnabled) {
                // User wants to enable auto-translate
                if (autoTranslateLanguage && neverAskAgain) {
                    // Use stored preference
                    localStorage.setItem('auto_translate_enabled', 'true');
                    console.log('🤖 Auto-translate enabled with stored language:', autoTranslateLanguage);
                } else {
                    // Show language selection modal
                    try {
                        const result = await showAutoTranslateLanguageModal();
                        localStorage.setItem('auto_translate_enabled', 'true');
                        localStorage.setItem('auto_translate_language', result.language);
                        localStorage.setItem('auto_translate_never_ask', result.neverAskAgain.toString());
                        console.log('🤖 Auto-translate enabled with language:', result.language, 'Never ask again:', result.neverAskAgain);
                    } catch (error) {
                        if (error === 'cancelled') {
                            // User cancelled, uncheck the checkbox
                            enableAutoTranslateCheckbox.checked = false;
                            return;
                        }
                        console.error('Error selecting auto-translate language:', error);
                        enableAutoTranslateCheckbox.checked = false;
                    }
                }
            } else {
                // User wants to disable auto-translate
                localStorage.setItem('auto_translate_enabled', 'false');
                hideTranslationSuggestion(); // Hide any active suggestions
                console.log('🤖 Auto-translate disabled');
            }
        });
    }
    
    function showAutoTranslateLanguageModal() {
        return new Promise((resolve, reject) => {
            const modal = document.getElementById('autoTranslateLanguageModal');
            const englishBtn = document.getElementById('autoTranslateLangEnglish');
            const frenchBtn = document.getElementById('autoTranslateLangFrench');
            const germanBtn = document.getElementById('autoTranslateLangGerman');
            const spanishBtn = document.getElementById('autoTranslateLangSpanish');
            const portugueseBtn = document.getElementById('autoTranslateLangPortuguese');
            const dutchBtn = document.getElementById('autoTranslateLangDutch');
            const cancelBtn = document.getElementById('autoTranslateLanguageCancelBtn');
            const neverAskCheckbox = document.getElementById('keepAutoTranslatePreference');

            const cleanup = () => {
                modal.classList.add('hidden');
                englishBtn.removeEventListener('click', handleEnglish);
                frenchBtn.removeEventListener('click', handleFrench);
                germanBtn.removeEventListener('click', handleGerman);
                spanishBtn.removeEventListener('click', handleSpanish);
                portugueseBtn.removeEventListener('click', handlePortuguese);
                dutchBtn.removeEventListener('click', handleDutch);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            const handleEnglish = () => {
                cleanup();
                resolve({ language: 'en-GB', neverAskAgain: neverAskCheckbox.checked });
            };
            const handleFrench = () => {
                cleanup();
                resolve({ language: 'fr-FR', neverAskAgain: neverAskCheckbox.checked });
            };
            const handleGerman = () => {
                cleanup();
                resolve({ language: 'de-DE', neverAskAgain: neverAskCheckbox.checked });
            };
            const handleSpanish = () => {
                cleanup();
                resolve({ language: 'es-US', neverAskAgain: neverAskCheckbox.checked });
            };
            const handlePortuguese = () => {
                cleanup();
                resolve({ language: 'pt-PT', neverAskAgain: neverAskCheckbox.checked });
            };
            const handleDutch = () => {
                cleanup();
                resolve({ language: 'nl-NL', neverAskAgain: neverAskCheckbox.checked });
            };
            const handleCancel = () => {
                cleanup();
                reject('cancelled');
            };

            englishBtn.addEventListener('click', handleEnglish);
            frenchBtn.addEventListener('click', handleFrench);
            germanBtn.addEventListener('click', handleGerman);
            spanishBtn.addEventListener('click', handleSpanish);
            portugueseBtn.addEventListener('click', handlePortuguese);
            dutchBtn.addEventListener('click', handleDutch);
            cancelBtn.addEventListener('click', handleCancel);

            modal.classList.remove('hidden');
        });
    }
    
    function showLiveNotesLanguageModal() {
        return new Promise((resolve, reject) => {
            const modal = document.getElementById('liveNotesLanguageModal');
            const englishBtn = document.getElementById('liveNotesLangEnglish');
            const frenchBtn = document.getElementById('liveNotesLangFrench');
            const germanBtn = document.getElementById('liveNotesLangGerman');
            const spanishBtn = document.getElementById('liveNotesLangSpanish');
            const portugueseBtn = document.getElementById('liveNotesLangPortuguese');
            const dutchBtn = document.getElementById('liveNotesLangDutch');
            const cancelBtn = document.getElementById('liveNotesLanguageCancelBtn');
            const keepPreferenceCheckbox = document.getElementById('keepLanguagePreference');

            const cleanup = () => {
                modal.classList.add('hidden');
                englishBtn.removeEventListener('click', handleEnglish);
                frenchBtn.removeEventListener('click', handleFrench);
                germanBtn.removeEventListener('click', handleGerman);
                spanishBtn.removeEventListener('click', handleSpanish);
                portugueseBtn.removeEventListener('click', handlePortuguese);
                dutchBtn.removeEventListener('click', handleDutch);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            const handleEnglish = () => { cleanup(); resolve({ language: 'en-GB', keepPreference: keepPreferenceCheckbox.checked }); };
            const handleFrench = () => { cleanup(); resolve({ language: 'fr-FR', keepPreference: keepPreferenceCheckbox.checked }); };
            const handleGerman = () => { cleanup(); resolve({ language: 'de-DE', keepPreference: keepPreferenceCheckbox.checked }); };
            const handleSpanish = () => { cleanup(); resolve({ language: 'es-US', keepPreference: keepPreferenceCheckbox.checked }); };
            const handlePortuguese = () => { cleanup(); resolve({ language: 'pt-PT', keepPreference: keepPreferenceCheckbox.checked }); };
            const handleDutch = () => { cleanup(); resolve({ language: 'nl-NL', keepPreference: keepPreferenceCheckbox.checked }); };
            const handleCancel = () => { cleanup(); reject('cancelled'); };

            englishBtn.addEventListener('click', handleEnglish);
            frenchBtn.addEventListener('click', handleFrench);
            germanBtn.addEventListener('click', handleGerman);
            spanishBtn.addEventListener('click', handleSpanish);
            portugueseBtn.addEventListener('click', handlePortuguese);
            dutchBtn.addEventListener('click', handleDutch);
            cancelBtn.addEventListener('click', handleCancel);

            modal.classList.remove('hidden');
        });
    }
    
    function closeLiveNotes() {
        // Clear timers first to stop any running processes
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
        }
        
        if (autoAdvanceTimer) {
            clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = null;
        }
        
        if (translationTimeout) {
            clearTimeout(translationTimeout);
            translationTimeout = null;
        }
        
        // Clear auto-save timeout
        if (window.autoSaveTimeout) {
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = null;
        }
        
        // Hide any translation suggestion
        hideTranslationSuggestion();
        
        // Save any pending changes before closing
        if (pendingChanges) {
            saveLiveNotes();
        }
        
        // Hide modal
        liveNotesModal.classList.add('hidden');
    }
    
    function handleNotepadInput(event) {
        notepadContent = event.target.value;
        pendingChanges = true;
        
        // Save content to localStorage for persistence
        localStorage.setItem('live_notes_content', notepadContent);
        
        // Clear existing auto-advance timer
        if (autoAdvanceTimer) {
            clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = null;
        }
        
        // Check for dash and trigger translation - include symbols that get converted to dashes
        const cursorPosition = event.target.selectionStart;
        const currentValue = event.target.value;
        const charBeforeCursor = currentValue.charAt(cursorPosition - 1);
        
        // If user just typed a dash or symbol that converts to dash, check for translation opportunity
        if (charBeforeCursor === '-' || charBeforeCursor === '–' || charBeforeCursor === '—' || 
            charBeforeCursor === '_' || charBeforeCursor === '·' || charBeforeCursor === '•' || 
            charBeforeCursor === '=' || charBeforeCursor === '→' || charBeforeCursor === '←') {
            handleDashTranslation(currentValue, cursorPosition);
        } else {
            // Hide any existing translation suggestion if user continues typing
            hideTranslationSuggestion();
        }
        
        // Parse content and update data
        parseNotepadContent();
        updateLineAndParsedCounts();
        updateSaveStatus();
        
        // Debounced auto-save - clear existing timeout and set new one
        if (window.autoSaveTimeout) {
            clearTimeout(window.autoSaveTimeout);
        }
        window.autoSaveTimeout = setTimeout(() => {
            if (pendingChanges) {
                saveLiveNotes();
            }
        }, 20000); // Auto-save after 20 seconds of inactivity
        
        // Only start 7-second timer for auto-advance if user is not editing existing text
        // Check if user is at the end of text and on a new/empty line
        const lines = currentValue.split('\n');
        const cursorLine = getCurrentLineFromCursor(currentValue, cursorPosition);
        const currentLineText = lines[cursorLine] || '';
        
        // Only auto-advance if:
        // 1. User is on the last line
        // 2. The current line doesn't contain a complete word-dash-translation pattern
        // 3. User is not in the middle of existing text
        // 4. There's some content that isn't just whitespace
        const isOnLastLine = cursorLine === lines.length - 1;
        const lineHasCompletePattern = /^.+\s*[-–—]\s*.+$/.test(currentLineText.trim());
        const isAtEndOfLine = cursorPosition >= currentValue.lastIndexOf('\n') + currentLineText.length;
        const hasIncompleteContent = currentLineText.trim().length > 0 && !lineHasCompletePattern;
        
        if (isOnLastLine && hasIncompleteContent && isAtEndOfLine) {
            // Start 7-second timer for auto-advance to next line
            autoAdvanceTimer = setTimeout(() => {
                addNewNoteLine();
            }, 7000);
        }
    }
    
    function getCurrentLineFromCursor(text, cursorPosition) {
        const beforeCursor = text.substring(0, cursorPosition);
        const lines = beforeCursor.split('\n');
        return lines.length - 1;
    }
    
    function handleNotepadKeydown(event) {
        // Clear auto-advance timer on any keypress
        if (autoAdvanceTimer) {
            clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = null;
        }
        
        // Handle Enter key - accept translation if suggestion is shown
        if (event.key === 'Enter') {
            if (currentTranslationSuggestion) {
                event.preventDefault(); // Prevent new line
                acceptTranslation();
                return;
            }
            // Natural behavior - just update counts
            setTimeout(() => {
                parseNotepadContent();
                updateLineAndParsedCounts();
            }, 10);
        }
        
        // Handle Escape key - dismiss translation suggestion
        if (event.key === 'Escape' && currentTranslationSuggestion) {
            event.preventDefault();
            hideTranslationSuggestion();
            return;
        }
        
        // Handle deletions - trigger immediate save to reflect deletions in database
        if (event.key === 'Backspace' || event.key === 'Delete') {
            // Hide translation suggestion if user is deleting
            hideTranslationSuggestion();
            
            setTimeout(() => {
                if (pendingChanges) {
                    saveLiveNotes();
                }
            }, 500); // Small delay to allow content processing
        }
    }
    
    function normalizeSymbolsInText(text) {
        // Convert underscores, arrows, dots between words to dashes
        // Handle various types of arrows and dots
        return text
            .replace(/[\u2192\u2190\u2194\u21d2\u21d0\u21d4\u2794\u27f6\u27f5\u27f7]/g, '-') // Various arrows
            .replace(/[_·•\.]{1,3}/g, '-') // Underscores, dots, middle dots
            .replace(/\s*-\s*/g, ' - ') // Normalize dash spacing
            .replace(/(-){2,}/g, '-'); // Remove multiple consecutive dashes
    }
    
    function parseNotepadContentForSaving() {
        // Get textarea and current cursor position
        const textarea = document.getElementById('liveNotesTextarea');
        const cursorPosition = textarea.selectionStart;
        const content = textarea.value;
        
        // Split content into lines
        const lines = content.split('\n');
        
        // Find which line the cursor is on
        let charCount = 0;
        let currentLineIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const lineStart = charCount;
            const lineEnd = charCount + lines[i].length;
            
            if (cursorPosition >= lineStart && cursorPosition <= lineEnd) {
                currentLineIndex = i;
                break;
            }
            charCount += lines[i].length + 1; // +1 for newline character
        }
        
        // Parse all lines with content
        const completedData = [];
        
        lines.forEach((line, index) => {
            // Skip empty lines
            if (line.trim() === '') return;
            
            let trimmedLine = line.trim();
            if (trimmedLine === '') return;
            
            // Normalize symbols first
            trimmedLine = normalizeSymbolsInText(trimmedLine);
            
            // Look for dash separator (-, –, —)
            const dashMatches = trimmedLine.match(/^(.+?)\s*[-–—]\s*(.+)$/);
            if (dashMatches) {
                const word = dashMatches[1].trim();
                const translation = dashMatches[2].trim();
                
                if (word && translation) {
                    const isCurrentLine = index === currentLineIndex;
                    const hasCompletePattern = dashMatches && word && translation;
                    
                    // Allow saving if:
                    // 1. It's not the current line (completed previous lines)
                    // 2. OR it's the current line but has a complete pattern (single pair completion)
                    // 3. OR it's the current line and user manually triggered save
                    const shouldSave = !isCurrentLine || (isCurrentLine && hasCompletePattern);
                    
                    if (shouldSave) {
                        completedData.push({
                            targetLang: word,
                            translation: translation,
                            lineNumber: index,
                            saved: false,
                            wasEdited: !isCurrentLine || (isCurrentLine && index < lines.length - 1) // Consider it an edit if it's not the last line or not currently being typed
                        });
                    }
                }
            }
        });
        
        return completedData;
    }
    
    function parseNotepadContent() {
        const lines = notepadContent.split('\n').filter(line => line.trim() !== '');
        liveNotesData = [];
        
        lines.forEach((line, index) => {
            let trimmedLine = line.trim();
            if (trimmedLine === '') return;
            
            // Normalize symbols first
            trimmedLine = normalizeSymbolsInText(trimmedLine);
            
            // Look for dash separator (-, –, —)
            const dashMatches = trimmedLine.match(/^(.+?)\s*[-–—]\s*(.+)$/);
            if (dashMatches) {
                const word = dashMatches[1].trim();
                const translation = dashMatches[2].trim();
                
                if (word && translation) {
                    liveNotesData.push({
                        targetLang: word,
                        translation: translation,
                        lineNumber: index,
                        saved: false
                    });
                }
            }
        });
    }
    
    function updateLineAndParsedCounts() {
        const totalLines = notepadContent.split('\n').filter(line => line.trim() !== '').length;
        const parsedLines = liveNotesData.length;
        
        lineCount.textContent = `Lines: ${totalLines}`;
        parsedCount.textContent = `Parsed: ${parsedLines}`;
    }
    
    function addNewNoteLine() {
        const cursorPos = liveNotesTextarea.selectionStart;
        const text = liveNotesTextarea.value;
        const beforeCursor = text.substring(0, cursorPos);
        const afterCursor = text.substring(cursorPos);
        
        // Add new line at cursor position
        let newText;
        if (beforeCursor.endsWith('\n') || beforeCursor === '') {
            newText = beforeCursor + '\n' + afterCursor;
        } else {
            newText = beforeCursor + '\n\n' + afterCursor;
        }
        
        liveNotesTextarea.value = newText;
        
        // Position cursor at the start of the new line
        const newCursorPos = beforeCursor.length + (beforeCursor.endsWith('\n') || beforeCursor === '' ? 1 : 2);
        liveNotesTextarea.setSelectionRange(newCursorPos, newCursorPos);
        liveNotesTextarea.focus();
        
        // Update content and counts
        notepadContent = newText;
        parseNotepadContent();
        updateLineAndParsedCounts();
    }
    
    function goToPreviousLine() {
        const cursorPos = liveNotesTextarea.selectionStart;
        const text = liveNotesTextarea.value;
        const beforeCursor = text.substring(0, cursorPos);
        
        // Find the previous line break
        const lastLineBreak = beforeCursor.lastIndexOf('\n');
        if (lastLineBreak > 0) {
            const secondLastLineBreak = beforeCursor.lastIndexOf('\n', lastLineBreak - 1);
            const previousLineStart = secondLastLineBreak + 1;
            const previousLineEnd = lastLineBreak;
            
            // Move cursor to the end of the previous line
            liveNotesTextarea.setSelectionRange(previousLineEnd, previousLineEnd);
            liveNotesTextarea.focus();
        } else if (lastLineBreak === 0) {
            // We're on the second line, go to the end of the first line
            liveNotesTextarea.setSelectionRange(0, 0);
            liveNotesTextarea.focus();
        }
        // If no previous line, stay where we are
    }
    
    function startAutoSaveTimer() {
        autoSaveCountdown = 300; // 5 minutes in seconds
        
        autoSaveTimer = setInterval(() => {
            autoSaveCountdown--;
            updateSaveStatus();
            
            if (autoSaveCountdown <= 0) {
                if (pendingChanges) {
                    saveLiveNotes();
                }
                autoSaveCountdown = 300; // Reset for next cycle
            }
        }, 1000);
    }
    
    function updateSaveStatus() {
        if (!saveStatus || !cloudIcon || !uploadArrow) {
            console.log('Save status elements not found, skipping update');
            return; // Prevent errors if elements don't exist
        }
        
        if (pendingChanges) {
            // Show pending state - orange cloud with upload arrow
            cloudIcon.className = 'w-5 h-5 text-amber-500 pending';
            uploadArrow.classList.remove('hidden');
            saveStatus.textContent = 'Changes pending';
            saveStatus.className = 'text-sm text-amber-600';
        } else {
            // Show saved state - light blue cloud, no arrow
            cloudIcon.className = 'w-5 h-5 text-blue-400 saved';
            uploadArrow.classList.add('hidden');
            saveStatus.textContent = 'All saved';
            saveStatus.className = 'text-sm text-blue-600';
        }
    }
    
    async function saveLiveNotes(isManualSave = false) {
        console.log('💾 saveLiveNotes: Starting live notes save process...');
        
        // Parse only completed lines (not the current line being typed)
        const completedNotesData = parseNotepadContentForSaving();
        console.log('💾 saveLiveNotes: Parsed completed lines, found', completedNotesData.length, 'completed notes');
        
        if (completedNotesData.length === 0) {
            console.log('💾 saveLiveNotes: No completed notes to save');
            return;
        }
        
        // Filter and prepare notes for saving
        const notesToSave = completedNotesData
            .filter(note => note.targetLang.trim() !== '' && note.translation.trim() !== '')
            .map(note => ({
                lang1: note.targetLang.trim(),
                lang2: note.translation.trim(),
                lineNumber: note.lineNumber, // Track line number for replacements
                isEdit: note.wasEdited || false // Track if this is an edit to existing content
            }));
        
        console.log('💾 saveLiveNotes: Prepared notes for saving:', {
            originalCount: completedNotesData.length,
            validCount: notesToSave.length,
            sampleNotes: notesToSave.slice(0, 2)
        });
        
        if (notesToSave.length === 0) {
            console.log('💾 saveLiveNotes: No valid notes to save');
            return;
        }
        
        // Separate new notes and edited notes
        const newNotes = [];
        const editedNotes = [];
        const duplicateNotes = [];
        
        console.log('🔍 saveLiveNotes: Processing notes for new, edited, and duplicates...');
        
        for (const note of notesToSave) {
            // Normalize text for comparison - remove spaces and convert to lowercase
            const normalizeForComparison = (text) => text.toLowerCase().replace(/\s+/g, '').trim();
            const noteWordNormalized = normalizeForComparison(note.lang1);
            
            // Find existing vocabulary item
            const existingVocabItem = vocabulary.find(v => {
                const vocabWordNormalized = normalizeForComparison(v.lang1);
                return vocabWordNormalized === noteWordNormalized;
            });
            
            if (existingVocabItem && note.isEdit) {
                // This is an edit to an existing row - replace it
                editedNotes.push({
                    ...note,
                    originalTerm: existingVocabItem.lang1,
                    originalDefinition: existingVocabItem.lang2
                });
                console.log('✏️ saveLiveNotes: Edit detected, will replace:', existingVocabItem.lang1, '->', note.lang1);
            } else if (existingVocabItem && !note.isEdit) {
                // This is a duplicate of existing content
                duplicateNotes.push(note);
                console.log('❌ saveLiveNotes: Duplicate detected, skipping:', note.lang1, '-', note.lang2);
            } else {
                // This is a new note
                newNotes.push(note);
                console.log('✅ saveLiveNotes: New note will be saved:', note.lang1, '-', note.lang2);
            }
        }
        
        console.log('📊 saveLiveNotes: Summary:', {
            totalNotesToProcess: notesToSave.length,
            newUniqueNotes: newNotes.length,
            editedNotes: editedNotes.length,
            duplicatesFound: duplicateNotes.length
        });
        
        // Process edited notes first (delete old, insert new)
        if (editedNotes.length > 0) {
            console.log('🔄 saveLiveNotes: Processing', editedNotes.length, 'edited notes...');
            for (const editedNote of editedNotes) {
                // Delete the old entry
                await deleteNoteFromDatabase(editedNote.originalTerm);
                // Add the new version to newNotes for insertion
                newNotes.push({
                    lang1: editedNote.lang1,
                    lang2: editedNote.lang2
                });
            }
        }
        
        // Show user feedback about duplicates only on manual save
        if (duplicateNotes.length > 0 && isManualSave) {
            const duplicateList = duplicateNotes.map(note => `"${note.lang1}"`).join(', ');
            if (newNotes.length > 0) {
                alert(`Found ${duplicateNotes.length} duplicate(s) that won't be saved: ${duplicateList}\n\nSaving ${newNotes.length} new/updated word(s).`);
            } else {
                alert(`All ${duplicateNotes.length} word(s) already exist in your vocabulary: ${duplicateList}\n\nNothing to save.`);
            }
        }
        
        if (newNotes.length === 0) {
            console.log('⚠️ saveLiveNotes: No new or edited notes to save');
            pendingChanges = false;
            updateSaveStatus();
            return;
        }
        
        // Save to database
        console.log('💾 saveLiveNotes: Calling saveNotes with', newNotes.length, 'new/updated notes...');
        const success = await saveNotes(newNotes);
        
        if (success) {
            const totalProcessed = newNotes.length + editedNotes.length;
            console.log(`✅ saveLiveNotes: Successfully saved ${totalProcessed} notes (${newNotes.length - editedNotes.length} new, ${editedNotes.length} updated)`);
            
            // Show user feedback only on manual save
            if (isManualSave) {
                const newCount = newNotes.length - editedNotes.length;
                const message = editedNotes.length > 0 ? 
                    `Successfully saved ${newCount} new and updated ${editedNotes.length} vocabulary notes!` :
                    `Successfully saved ${newCount} new vocabulary notes!`;
                alert(message);
            }
            
            // Mark saved notes
            completedNotesData.forEach(note => {
                note.saved = true;
            });
            
            pendingChanges = false;
            updateSaveStatus();
            updateLineAndParsedCounts();
            
            // Clear localStorage content since it's been saved
            localStorage.removeItem('live_notes_content');
            console.log('🧹 Live Notes content cleared from localStorage after successful save');
            
            // Refresh vocabulary
            console.log('🔄 saveLiveNotes: Refreshing vocabulary from database...');
            await fetchNotes();
        } else {
            console.error('❌ saveLiveNotes: Failed to save notes');
            // Update status to show error
            if (saveStatus) {
                saveStatus.textContent = 'Save failed';
                saveStatus.className = 'text-sm text-red-600';
            }
        }
    }
    
    // Helper function to delete a note from the database
    async function deleteNoteFromDatabase(term) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                console.error('No authenticated user found for deletion');
                return false;
            }
            
            const { error } = await supabaseClient
                .from('notes')
                .delete()
                .eq('user_id', user.id)
                .eq('term', term);
                
            if (error) {
                console.error('Error deleting note:', error);
                return false;
            }
            
            console.log('✅ Successfully deleted note:', term);
            return true;
        } catch (err) {
            console.error('Unexpected error deleting note:', err);
            return false;
        }
    }
    
    function clearAllLiveNotes() {
        if (confirm('Are you sure you want to clear all notes? Unsaved changes will be lost.')) {
            liveNotesData = [];
            notepadContent = '';
            liveNotesTextarea.value = '';
            pendingChanges = false;
            updateSaveStatus();
            updateLineAndParsedCounts();
            liveNotesTextarea.focus();
        }
    }

    // --- LIVE TRANSLATION FUNCTIONS ---
    async function translateText(text, langPair) {
        if (!text.trim()) return ''; // Don't translate empty text
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.responseData) {
                return data.responseData.translatedText;
            } else {
                return "Translation failed.";
            }
        } catch (error) {
            console.error('Translation API error:', error);
            return "Translation error.";
        }
    }

    function showTranslationSuggestion(text, translation, cursorPosition) {
        // Remove any existing suggestion
        hideTranslationSuggestion();

        const textarea = liveNotesTextarea;
        const suggestionElement = document.createElement('div');
        suggestionElement.id = 'translationSuggestion';
        
        suggestionElement.style.cssText = `
            position: absolute;
            background: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            z-index: 1002;
            min-width: 250px;
            max-width: 350px;
            font-family: 'Inter', sans-serif;
        `;

        suggestionElement.innerHTML = `
            <div class="flex justify-between items-start gap-2 mb-2">
                <span class="text-sm font-medium text-blue-800">🤖 Auto-translation:</span>
                <button id="dismissTranslationBtn" class="text-red-500 hover:text-red-700 font-bold text-lg leading-none cursor-pointer">×</button>
            </div>
            <div class="bg-white border border-blue-200 rounded p-2 mb-3">
                <div class="text-xs text-gray-500 mb-1">Original: <span class="font-medium text-gray-700">${text}</span></div>
                <div class="text-sm font-medium text-gray-900">${translation}</div>
            </div>
            <div class="flex gap-2">
                <button id="acceptTranslationBtn" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium cursor-pointer transition-colors">
                    ✓ Accept (Enter)
                </button>
                <button id="dismissTranslationBtn2" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-2 rounded text-sm font-medium cursor-pointer transition-colors">
                    × Dismiss (Esc)
                </button>
            </div>
        `;

        // Position the suggestion within the Live Notes container
        const liveNotesContainer = document.getElementById('liveNotesContainer');
        liveNotesContainer.style.position = 'relative'; // Ensure container has relative positioning
        
        // Position relative to the textarea within the container
        const textareaRect = textarea.getBoundingClientRect();
        const containerRect = liveNotesContainer.getBoundingClientRect();
        
        // Calculate position relative to container
        const relativeLeft = textareaRect.left - containerRect.left;
        const relativeTop = textareaRect.top - containerRect.top;
        
        // Position to the right of the textarea if there's space, otherwise below
        const containerWidth = liveNotesContainer.offsetWidth;
        const suggestionWidth = 350;
        
        if (relativeLeft + textareaRect.width + suggestionWidth + 20 < containerWidth) {
            // Position to the right
            suggestionElement.style.left = (relativeLeft + textareaRect.width + 10) + 'px';
            suggestionElement.style.top = (relativeTop + 50) + 'px';
        } else {
            // Position below
            suggestionElement.style.left = (relativeLeft + 20) + 'px';
            suggestionElement.style.top = (relativeTop + textareaRect.height - 50) + 'px';
        }

        // Append to the Live Notes container instead of body
        liveNotesContainer.appendChild(suggestionElement);

        // Store current suggestion data
        currentTranslationSuggestion = {
            text: text,
            translation: translation,
            cursorPosition: cursorPosition,
            element: suggestionElement
        };

        // Add event listeners
        const acceptBtn = document.getElementById('acceptTranslationBtn');
        const dismissBtn1 = document.getElementById('dismissTranslationBtn');
        const dismissBtn2 = document.getElementById('dismissTranslationBtn2');

        acceptBtn.addEventListener('click', acceptTranslation);
        dismissBtn1.addEventListener('click', hideTranslationSuggestion);
        dismissBtn2.addEventListener('click', hideTranslationSuggestion);

        console.log(`💡 Showing translation suggestion: "${text}" → "${translation}"`);
    }

    function hideTranslationSuggestion() {
        const existing = document.getElementById('translationSuggestion');
        if (existing) {
            existing.remove();
        }
        currentTranslationSuggestion = null;
    }

    function acceptTranslation() {
        if (!currentTranslationSuggestion) return;

        const { text, translation, cursorPosition } = currentTranslationSuggestion;
        const textarea = liveNotesTextarea;
        const currentValue = textarea.value;
        
        // Find the position of the text that was translated
        const beforeCursor = currentValue.substring(0, cursorPosition);
        const lastDashIndex = beforeCursor.lastIndexOf(' - ');
        
        if (lastDashIndex !== -1) {
            // Replace the content after the dash with the translation
            const beforeDash = currentValue.substring(0, lastDashIndex + 3); // Include " - "
            const afterCursor = currentValue.substring(cursorPosition);
            const newValue = beforeDash + translation + afterCursor;
            
            textarea.value = newValue;
            
            // Position cursor after the translation
            const newCursorPos = beforeDash.length + translation.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
            
            // Update content and trigger parsing
            notepadContent = newValue;
            parseNotepadContent();
            updateLineAndParsedCounts();
            updateSaveStatus();
            pendingChanges = true;
        }

        hideTranslationSuggestion();
    }

    async function handleDashTranslation(text, cursorPosition) {
        // Check if auto-translate is enabled
        const autoTranslateEnabled = localStorage.getItem('auto_translate_enabled') === 'true';
        if (!autoTranslateEnabled) {
            return; // Auto-translate is disabled, do nothing
        }

        // Clear any existing timeout
        if (translationTimeout) {
            clearTimeout(translationTimeout);
        }

        // Get the current line and word before the dash
        const beforeCursor = text.substring(0, cursorPosition);
        const lines = beforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Check if this line contains a dash and extract the word before it
        const dashMatch = currentLine.match(/^(.+?)\s*-\s*$/);
        if (dashMatch) {
            const wordToTranslate = dashMatch[1].trim();
            if (wordToTranslate) {
                // Get the auto-translate target language
                const autoTranslateLanguage = localStorage.getItem('auto_translate_language') || 'es-US';
                let langPair;
                
                // Determine translation direction based on auto-translate target language
                // The user types a word and gets translation to the target language they selected
                if (autoTranslateLanguage === 'en-GB' || autoTranslateLanguage === 'en-US') {
                    // Translating TO English - assume input could be Spanish/French/etc
                    // Try multiple source languages, prioritize Spanish
                    langPair = 'es|en';
                } else if (autoTranslateLanguage === 'es-US') {
                    // Translating TO Spanish - translate from English to Spanish
                    langPair = 'en|es';
                } else if (autoTranslateLanguage === 'fr-FR') {
                    // Translating TO French - translate from English to French
                    langPair = 'en|fr';
                } else if (autoTranslateLanguage === 'de-DE') {
                    // Translating TO German - translate from English to German
                    langPair = 'en|de';
                } else if (autoTranslateLanguage === 'pt-PT') {
                    // Translating TO Portuguese - translate from English to Portuguese
                    langPair = 'en|pt';
                } else if (autoTranslateLanguage === 'nl-NL') {
                    // Translating TO Dutch - translate from English to Dutch
                    langPair = 'en|nl';
                } else {
                    // Default to English to Spanish
                    langPair = 'en|es';
                }

                // Set a timeout to avoid too many API calls
                translationTimeout = setTimeout(async () => {
                    try {
                        console.log(`🔄 Translating "${wordToTranslate}" using language pair: ${langPair} (Auto-translate: ${autoTranslateLanguage})`);
                        const translation = await translateText(wordToTranslate, langPair);
                        if (translation && translation !== 'Translation failed.' && translation !== 'Translation error.' && translation.toLowerCase() !== wordToTranslate.toLowerCase()) {
                            console.log(`✅ Translation result: "${translation}"`);
                            showTranslationSuggestion(wordToTranslate, translation, cursorPosition);
                        } else {
                            console.log(`❌ No valid translation found for "${wordToTranslate}"`);
                        }
                    } catch (error) {
                        console.error('Translation error:', error);
                    }
                }, 500); // Wait 500ms before making the API call
            }
        }
    }

    function showLanguageSelectionModal(file = null) {
        return new Promise((resolve, reject) => {
            const modal = document.getElementById('csvLanguageModal');
            const englishBtn = document.getElementById('csvLangEnglish');
            const frenchBtn = document.getElementById('csvLangFrench');
            const germanBtn = document.getElementById('csvLangGerman');
            const spanishBtn = document.getElementById('csvLangSpanish');
            const portugueseBtn = document.getElementById('csvLangPortuguese');
            const dutchBtn = document.getElementById('csvLangDutch');
            const cancelBtn = document.getElementById('csvLanguageCancelBtn');

            const cleanup = () => {
                modal.classList.add('hidden');
                englishBtn.removeEventListener('click', handleEnglish);
                frenchBtn.removeEventListener('click', handleFrench);
                germanBtn.removeEventListener('click', handleGerman);
                spanishBtn.removeEventListener('click', handleSpanish);
                portugueseBtn.removeEventListener('click', handlePortuguese);
                dutchBtn.removeEventListener('click', handleDutch);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            const handleEnglish = () => { cleanup(); resolve('en-GB'); };
            const handleFrench = () => { cleanup(); resolve('fr-FR'); };
            const handleGerman = () => { cleanup(); resolve('de-DE'); };
            const handleSpanish = () => { cleanup(); resolve('es-US'); };
            const handlePortuguese = () => { cleanup(); resolve('pt-PT'); };
            const handleDutch = () => { cleanup(); resolve('nl-NL'); };
            const handleCancel = () => { cleanup(); reject('cancelled'); };

            englishBtn.addEventListener('click', handleEnglish);
            frenchBtn.addEventListener('click', handleFrench);
            germanBtn.addEventListener('click', handleGerman);
            spanishBtn.addEventListener('click', handleSpanish);
            portugueseBtn.addEventListener('click', handlePortuguese);
            dutchBtn.addEventListener('click', handleDutch);
            cancelBtn.addEventListener('click', handleCancel);

            modal.classList.remove('hidden');
        });
    }

    async function handleFileUpload(droppedFile = null) {
        console.log('handleFileUpload called');
        
        // Prevent file upload during authentication process
        if (isAuthenticating) {
            console.log('handleFileUpload: Blocked during authentication process');
            return;
        }
        
        const file = droppedFile || (csvFileInput.files.length > 0 ? csvFileInput.files[0] : null);
        if (!file) {
            uploadStatus.textContent = 'Please select or drop a CSV file.';
            uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
            return;
        }

        if (!(file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv"))) {
            uploadStatus.textContent = 'Invalid file type. Please use a CSV file.';
            uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
            return;
        }

        // Show language selection modal
        try {
            csvUploadedTargetLanguage = await showLanguageSelectionModal(file);
            console.log('🌐 Selected language for CSV:', csvUploadedTargetLanguage);
            // Store the selected language for Live Notes
            localStorage.setItem('learning_language', csvUploadedTargetLanguage);
        } catch (error) {
            if (error === 'cancelled') {
                uploadStatus.textContent = 'Upload cancelled.';
                uploadStatus.className = 'text-sm text-gray-600 mt-2 h-5';
                // Clear the file input
                csvFileInput.value = '';
                return;
            }
            throw error;
        }

        uploadStatus.textContent = 'Processing CSV file...';
        uploadStatus.className = 'text-sm text-blue-600 mt-2 h-5';

        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                 console.log('FileReader loaded:', event.target.result.slice(0,100)); // <--- add preview
                const parsedNotes = parseCSV(event.target.result);
                   console.log('Parsed notes:', parsedNotes); // <--- add
                if (parsedNotes.length > 0) {
                    uploadStatus.textContent = 'Saving notes to your account...';
                    uploadStatus.className = 'text-sm text-blue-600 mt-2 h-5';
                    const success = await saveNotes(parsedNotes);
                    if (success) {
                        await fetchNotes();
                        uploadStatus.textContent = `Successfully saved ${parsedNotes.length} new notes!`;
                        uploadStatus.className = 'text-sm text-green-600 mt-2 h-5';
                        isEssentialsMode = false;
                        setTimeout(() => {
                            uploadSection.classList.add('hidden');
                            showGameSelection();
                        }, 1500);
                    }
                } else {
                    uploadStatus.textContent = 'No vocabulary found. Check file format.';
                    uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
                }
            } catch (error) {
                uploadStatus.textContent = 'Error processing CSV file.';
                uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
                console.error("Error processing CSV:", error);
            }
        };
        reader.onerror = () => {
            uploadStatus.textContent = 'Error reading file.';
            uploadStatus.className = 'text-sm text-red-600 mt-2 h-5';
        };
        reader.readAsText(file);
    }

    // --- NOTES MANAGEMENT FUNCTIONS ---
    function initializeNotesManagement() {
        console.log('📚 initializeNotesManagement: Opening notes management interface');
        console.log('📚 initializeNotesManagement: Current vocabulary state:', {
            vocabularyLength: vocabulary.length,
            vocabularyType: typeof vocabulary,
            vocabularyIsArray: Array.isArray(vocabulary),
            sampleVocab: vocabulary.slice(0, 2)
        });
        
        // Get modal elements
        const notesManagementModal = document.getElementById('notesManagementModal');
        const notesCount = document.getElementById('notesCount');
        const notesList = document.getElementById('notesList');
        const noNotesMessage = document.getElementById('noNotesMessage');
        const notesSearchInput = document.getElementById('notesSearchInput');
        
        if (!notesManagementModal) {
            console.error('❌ initializeNotesManagement: Notes management modal not found');
            return;
        }
        
        console.log('📚 initializeNotesManagement: Modal elements found, setting up interface');
        
        // Update notes count
        if (notesCount) {
            notesCount.textContent = vocabulary.length;
            console.log('📚 initializeNotesManagement: Set notes count to:', vocabulary.length);
        }
        
        // Populate notes list
        console.log('📚 initializeNotesManagement: Calling populateNotesList...');
        populateNotesList();
        
        // Setup search functionality
        if (notesSearchInput) {
            notesSearchInput.addEventListener('input', filterNotes);
            console.log('📚 initializeNotesManagement: Search functionality setup complete');
        }
        
        // Setup time filter functionality
        const timeFilterSelect = document.getElementById('timeFilterSelect');
        const studyFilteredNotesBtn = document.getElementById('studyFilteredNotesBtn');
        
        if (timeFilterSelect) {
            timeFilterSelect.addEventListener('change', filterNotes);
            console.log('📚 initializeNotesManagement: Time filter functionality setup complete');
        }
        
        if (studyFilteredNotesBtn) {
            studyFilteredNotesBtn.addEventListener('click', () => {
                const filteredVocab = getFilteredVocabulary();
                if (filteredVocab.length > 0) {
                    // Close notes management and start matching game with filtered notes
                    closeNotesManagement();
                    startFilteredMatchingGame(filteredVocab);
                }
            });
        }
        
        // Show modal
        notesManagementModal.classList.remove('hidden');
        console.log('📚 initializeNotesManagement: Modal shown');
    }
    
    function populateNotesList(searchTerm = '', timeFilter = 'all') {
        console.log('📝 populateNotesList: Starting with searchTerm:', searchTerm, 'timeFilter:', timeFilter);
        console.log('📝 populateNotesList: Current vocabulary state:', {
            vocabularyLength: vocabulary.length,
            vocabularyType: typeof vocabulary,
            vocabularyIsArray: Array.isArray(vocabulary),
            sampleVocab: vocabulary.slice(0, 2)
        });
        
        const notesList = document.getElementById('notesList');
        const noNotesMessage = document.getElementById('noNotesMessage');
        const studyFilteredNotesBtn = document.getElementById('studyFilteredNotesBtn');
        const filteredNotesCount = document.getElementById('filteredNotesCount');
        
        if (!notesList) {
            console.error('❌ populateNotesList: notesList element not found');
            return;
        }
        
        // Clear existing content
        notesList.innerHTML = '';
        
        // Filter vocabulary based on search term and time filter
        const filteredVocab = vocabulary.filter(note => {
            // Apply search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!note.lang1.toLowerCase().includes(term) && !note.lang2.toLowerCase().includes(term)) {
                    return false;
                }
            }
            
            // Apply time filter
            if (timeFilter !== 'all' && note.created_at) {
                const noteDate = new Date(note.created_at);
                const now = new Date();
                const timeDiff = now - noteDate;
                
                switch (timeFilter) {
                    case 'today':
                        return timeDiff <= 24 * 60 * 60 * 1000; // 1 day
                    case 'week':
                        return timeDiff <= 7 * 24 * 60 * 60 * 1000; // 7 days
                    case 'month':
                        return timeDiff <= 30 * 24 * 60 * 60 * 1000; // 30 days
                    case '3months':
                        return timeDiff <= 90 * 24 * 60 * 60 * 1000; // 90 days
                    default:
                        return true;
                }
            }
            
            return true;
        });
        
        console.log('📝 populateNotesList: Filtered vocabulary:', {
            originalCount: vocabulary.length,
            filteredCount: filteredVocab.length,
            searchTerm,
            timeFilter,
            sampleFiltered: filteredVocab.slice(0, 2)
        });
        
        // Update filtered notes count and study button
        if (filteredNotesCount) {
            if (timeFilter !== 'all' || searchTerm) {
                let displayMessage = '';
                
                if (timeFilter !== 'all') {
                    const timePeriodMap = {
                        'today': 'last day',
                        'week': 'last week', 
                        'month': 'last month',
                        '3months': 'last 3 months'
                    };
                    displayMessage = `Your notes over the ${timePeriodMap[timeFilter]} are ${filteredVocab.length}`;
                } else if (searchTerm) {
                    displayMessage = `Showing ${filteredVocab.length} notes`;
                }
                
                filteredNotesCount.textContent = displayMessage;
                if (studyFilteredNotesBtn && filteredVocab.length > 0) {
                    studyFilteredNotesBtn.classList.remove('hidden');
                    studyFilteredNotesBtn.textContent = `🎮 Play Matching Game (${filteredVocab.length} words)`;
                } else if (studyFilteredNotesBtn) {
                    studyFilteredNotesBtn.classList.add('hidden');
                }
            } else {
                filteredNotesCount.textContent = '';
                if (studyFilteredNotesBtn) {
                    studyFilteredNotesBtn.classList.add('hidden');
                }
            }
        }
        
        if (filteredVocab.length === 0) {
            console.log('📝 populateNotesList: No filtered vocabulary, showing no notes message');
            if (noNotesMessage) {
                noNotesMessage.classList.remove('hidden');
                noNotesMessage.textContent = searchTerm ? 'No notes match your search.' : 'No notes found. Upload a CSV file or use Study Essentials to get started!';
            }
            return;
        }
        
        if (noNotesMessage) {
            noNotesMessage.classList.add('hidden');
        }
        
        console.log('📝 populateNotesList: Creating note items for', filteredVocab.length, 'notes');
        
        // Create note items
        filteredVocab.forEach((note, filteredIndex) => {
            // Find the original index in the vocabulary array
            const originalIndex = vocabulary.findIndex(v => v.lang1 === note.lang1 && v.lang2 === note.lang2);
            
            console.log('📝 populateNotesList: Creating item', filteredIndex, 'originalIndex:', originalIndex, 'note:', note);
            
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item p-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100';
            
            const noteContent = document.createElement('div');
            noteContent.className = 'flex-1 cursor-pointer';
            noteContent.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="flex-1">
                        <span class="font-medium text-gray-900 click-to-speak" data-text="${note.lang1}" data-lang="${note.term_lang || csvUploadedTargetLanguage}">${note.lang1}</span>
                        <span class="text-gray-600 mx-2">—</span>
                        <span class="text-gray-700 click-to-speak" data-text="${note.lang2}" data-lang="en">${note.lang2}</span>
                    </div>
                </div>
            `;
            
            noteContent.addEventListener('click', (e) => {
                if (e.target.classList.contains('click-to-speak')) {
                    // Only allow clicking on target language (first word)
                    if (e.target.dataset.text === note.lang1) {
                        const text = e.target.dataset.text;
                        const lang = e.target.dataset.lang;
                        console.log('🔊 populateNotesList: Speaking text:', text, 'in language:', lang);
                        speakText(text, lang);
                    }
                }
            });
            
            // Add edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'ml-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded edit-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit note';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                console.log('✏️ populateNotesList: Edit button clicked for note:', note);
                editNote(originalIndex, note);
            });
            
            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded delete-btn';
            deleteBtn.innerHTML = '✕';
            deleteBtn.title = 'Delete note';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                console.log('🗑️ populateNotesList: Delete button clicked for note:', note);
                deleteNote(originalIndex, note);
            });
            
            noteItem.appendChild(noteContent);
            noteItem.appendChild(editBtn);
            noteItem.appendChild(deleteBtn);
            
            // Add swipe-to-delete for mobile
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            
            noteItem.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            }, { passive: true });
            
            noteItem.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
                const diffX = startX - currentX;
                
                if (diffX > 50) {
                    noteItem.style.transform = `translateX(-${Math.min(diffX, 100)}px)`;
                    noteItem.style.backgroundColor = '#fee2e2';
                }
            }, { passive: true });
            
            noteItem.addEventListener('touchend', () => {
                if (!isDragging) return;
                const diffX = startX - currentX;
                
                if (diffX > 150) {  // Increased threshold for more complete swipe
                    console.log('📱 populateNotesList: Swipe delete triggered for note:', note);
                    deleteNote(originalIndex, note);
                } else {
                    noteItem.style.transform = '';
                    noteItem.style.backgroundColor = '';
                }
                isDragging = false;
            }, { passive: true });
            
            notesList.appendChild(noteItem);
        });
        
        console.log('📝 populateNotesList: Successfully created', filteredVocab.length, 'note items');
    }
    
    function filterNotes() {
        const notesSearchInput = document.getElementById('notesSearchInput');
        const timeFilterSelect = document.getElementById('timeFilterSelect');
        const searchTerm = notesSearchInput ? notesSearchInput.value : '';
        const timeFilter = timeFilterSelect ? timeFilterSelect.value : 'all';
        populateNotesList(searchTerm, timeFilter);
    }
    
    function getFilteredVocabulary() {
        const notesSearchInput = document.getElementById('notesSearchInput');
        const timeFilterSelect = document.getElementById('timeFilterSelect');
        const searchTerm = notesSearchInput ? notesSearchInput.value : '';
        const timeFilter = timeFilterSelect ? timeFilterSelect.value : 'all';
        
        return vocabulary.filter(note => {
            // Apply search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!note.lang1.toLowerCase().includes(term) && !note.lang2.toLowerCase().includes(term)) {
                    return false;
                }
            }
            
            // Apply time filter
            if (timeFilter !== 'all' && note.created_at) {
                const noteDate = new Date(note.created_at);
                const now = new Date();
                const timeDiff = now - noteDate;
                
                switch (timeFilter) {
                    case 'today':
                        return timeDiff <= 24 * 60 * 60 * 1000; // 1 day
                    case 'week':
                        return timeDiff <= 7 * 24 * 60 * 60 * 1000; // 7 days
                    case 'month':
                        return timeDiff <= 30 * 24 * 60 * 60 * 1000; // 30 days
                    case '3months':
                        return timeDiff <= 90 * 24 * 60 * 60 * 1000; // 90 days
                    default:
                        return true;
                }
            }
            
            return true;
        });
    }
    
    function startFilteredMatchingGame(filteredVocab) {
        // Store the filtered vocabulary for the game
        window.filteredGameVocabulary = filteredVocab;
        
        // Set current vocabulary part to filtered vocab
        currentVocabularyPart = filteredVocab;
        
        // Navigate to game area
        hideAllSections();
        gameArea.classList.remove('hidden');
        
        // Set up matching game with filtered vocabulary
        showSection('matching');
        initMatchingGame();
    }
    
    async function deleteNote(index, note) {
        try {
            // Delete from database
            if (supabaseClient) {
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    const { error } = await supabaseClient
                        .from('notes')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('term', note.lang1)
                        .eq('definition', note.lang2);
                    
                    if (error) {
                        console.error('Error deleting note from database:', error);
                        alert('Error deleting note from database');
                        return;
                    }
                }
            }
            
            // Remove from vocabulary array
            vocabulary.splice(index, 1);
            
            // Update UI
            const notesCount = document.getElementById('notesCount');
            if (notesCount) {
                notesCount.textContent = vocabulary.length;
            }
            
            // Refresh the notes list with current search term
            const notesSearchInput = document.getElementById('notesSearchInput');
            const currentSearchTerm = notesSearchInput ? notesSearchInput.value : '';
            populateNotesList(currentSearchTerm);
            
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Error deleting note');
        }
    }
    
    function editNote(index, note) {
        // Create edit modal
        const editModal = document.createElement('div');
        editModal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
        editModal.style.zIndex = '1005';
        
        editModal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4 text-center">✏️ Edit Note</h3>
                    <div class="mt-2 px-4 py-3">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Target Language Word/Phrase:</label>
                            <input type="text" id="editTermInput" value="${note.lang1}" class="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Definition/Translation:</label>
                            <input type="text" id="editDefinitionInput" value="${note.lang2}" class="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
                        </div>
                    </div>
                    <div class="flex gap-2 px-4 py-3">
                        <button id="saveEditBtn" class="flex-1 px-4 py-2 bg-teal-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                            💾 Save Changes
                        </button>
                        <button id="cancelEditBtn" class="flex-1 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(editModal);
        
        const termInput = document.getElementById('editTermInput');
        const definitionInput = document.getElementById('editDefinitionInput');
        const saveBtn = document.getElementById('saveEditBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        
        // Focus on term input
        termInput.focus();
        termInput.select();
        
        const cleanup = () => {
            document.body.removeChild(editModal);
        };
        
        cancelBtn.addEventListener('click', cleanup);
        
        saveBtn.addEventListener('click', async () => {
            const newTerm = termInput.value.trim();
            const newDefinition = definitionInput.value.trim();
            
            if (!newTerm || !newDefinition) {
                alert('Both fields must be filled out.');
                return;
            }
            
            try {
                // Update in database if Supabase is available
                if (supabaseClient) {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user) {
                        // Update the existing note
                        const { error } = await supabaseClient
                            .from('notes')
                            .update({
                                term: newTerm,
                                definition: newDefinition
                            })
                            .eq('user_id', user.id)
                            .eq('term', note.lang1)
                            .eq('definition', note.lang2);
                        
                        if (error) {
                            console.error('Error updating note in database:', error);
                            alert('Error updating note in database');
                            return;
                        }
                        
                        console.log('✅ Note updated in database successfully');
                    }
                }
                
                // Update in local vocabulary array
                if (index >= 0 && index < vocabulary.length) {
                    vocabulary[index].lang1 = newTerm;
                    vocabulary[index].lang2 = newDefinition;
                }
                
                console.log('✅ Note updated locally:', { index, newTerm, newDefinition });
                
                // Refresh the notes list to show changes
                const notesSearchInput = document.getElementById('notesSearchInput');
                const currentSearchTerm = notesSearchInput ? notesSearchInput.value : '';
                populateNotesList(currentSearchTerm);
                
                cleanup();
                
            } catch (error) {
                console.error('Error editing note:', error);
                alert('Error editing note');
            }
        });
        
        // Handle Enter key to save
        termInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                definitionInput.focus();
            }
        });
        
        definitionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveBtn.click();
            }
        });
    }
    
    function speakText(text, lang = 'en-GB') {
        if ('speechSynthesis' in window && text) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Ensure proper language mapping for better cross-browser support
            if (lang === 'es-US' || lang === 'es-ES') {
                // Force es-US for better pronunciation on Safari/Mac
                utterance.lang = 'es-US';
            } else if (lang === 'en-US' || lang === 'en-GB') {
                // Force en-GB as default English
                utterance.lang = 'en-GB';
            } else {
                utterance.lang = lang;
            }
            
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            // Additional Safari/Mac compatibility
            if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
                utterance.rate = 0.9;
                // Force voice selection for better pronunciation on Safari
                const voices = window.speechSynthesis.getVoices();
                if (utterance.lang.startsWith('es')) {
                    const spanishVoice = voices.find(voice => 
                        voice.lang.includes('es-US') || voice.lang.includes('es-MX') || voice.lang.includes('es')
                    );
                    if (spanishVoice) utterance.voice = spanishVoice;
                } else if (utterance.lang.startsWith('en')) {
                    const englishVoice = voices.find(voice => 
                        voice.lang.includes('en-GB') || voice.lang.includes('en-US')
                    );
                    if (englishVoice) utterance.voice = englishVoice;
                }
            }
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    function closeNotesManagement() {
        const notesManagementModal = document.getElementById('notesManagementModal');
        if (notesManagementModal) {
            notesManagementModal.classList.add('hidden');
        }
    }

    // --- UI & NAVIGATION ---
    function hideAllGames() { [matchingGameContainer, multipleChoiceGameContainer, typeTranslationGameContainer, talkToMeGameContainer, fillInTheBlanksGameContainer, findTheWordsGameContainer, gameOverMessage, roundCompleteMessageDiv, bonusRoundCountdownMessageDiv].forEach(el => el.classList.add('hidden')); }
    function showGameInfoBar() { [mistakeTrackerDiv, currentScoreDisplay, maxScoreDisplay].forEach(el => el.classList.remove('hidden')); }
    function showMainSelection() { 
        // If user has existing vocabulary, skip main selection and go directly to games
        if (vocabulary && vocabulary.length > 0) {
            console.log('showMainSelection: User has existing vocabulary, redirecting to games');
            showGameSelection();
            return;
        }
        
        console.log('showMainSelection: Showing main selection interface');
        console.log('showMainSelection: isAuthenticating =', isAuthenticating, 'vocabulary.length =', vocabulary.length);
        mainSelectionSection.classList.remove('hidden'); 
        [uploadSection, essentialsCategorySelectionSection, essentialsCategoryOptionsSection, gameSelectionSection, gameArea, partSelectionContainer].forEach(el => {
            if (el) el.classList.add('hidden');
        }); 
        isEssentialsMode = false; 
    }
    function showGameSelection() {
        console.log('🎮 showGameSelection: Showing game selection interface');
        console.log('🎮 showGameSelection: Current state:', {
            isAuthenticating,
            vocabularyLength: vocabulary.length,
            vocabularyIsArray: Array.isArray(vocabulary),
            vocabulary: vocabulary.slice(0, 2) // Show first 2 items for debugging
        });
        
        if (!isEssentialsMode) {
            activeTargetStudyLanguage = csvUploadedTargetLanguage; 
            console.log('🌐 showGameSelection: Set activeTargetStudyLanguage to:', activeTargetStudyLanguage);
        } 

        // Hide all other sections
        [mainSelectionSection, uploadSection, essentialsCategorySelectionSection, essentialsCategoryOptionsSection, partSelectionContainer, gameArea].forEach(el => {
            if (el) el.classList.add('hidden');
        });
        hideAllGames();

        // Show game selection
        gameSelectionSection.classList.remove('hidden');
        fillInTheBlanksBtn.classList.toggle('hidden', !isEssentialsMode); 
        findTheWordsBtn.classList.remove('hidden'); 

        const activeVocab = isEssentialsMode ? currentVocabularyPart : vocabulary;
        console.log('🎮 showGameSelection: Active vocabulary details:', {
            isEssentialsMode,
            activeVocabLength: activeVocab.length,
            activeVocabType: typeof activeVocab,
            activeVocabIsArray: Array.isArray(activeVocab),
            activeVocab: activeVocab.slice(0, 2) // Show sample
        });

        if (activeVocab.length === 0) { 
            console.log('❌ showGameSelection: No vocabulary found, showing no vocabulary message');
            noVocabularyMessage.classList.remove('hidden'); 
            gameButtonsContainer.classList.add('hidden'); 
        } else { 
            console.log('✅ showGameSelection: Vocabulary found, showing game buttons');
            noVocabularyMessage.classList.add('hidden'); 
            gameButtonsContainer.classList.remove('hidden'); 
        }
    }
    function populateEssentialsCategoryButtons() { 
        essentialsCategoryButtonsContainer.innerHTML = ''; 
        Object.keys(essentialsVocabularyData).forEach(categoryKey => { 
            const button = document.createElement('button'); 
            button.className = 'btn essentials-category-btn p-3 sm:p-4 text-sm sm:text-md'; 
            button.textContent = categoryKey; 
            button.addEventListener('click', () => { 
                currentEssentialsCategoryName = categoryKey; 
                isEssentialsMode = true; 
                if (categoryKey.toLowerCase().includes("(en-es)")) { 
                    activeTargetStudyLanguage = 'es-US'; 
                } else if (categoryKey.toLowerCase().includes("(en-fr)")) { 
                    activeTargetStudyLanguage = 'fr-FR'; 
                } else { 
                    activeTargetStudyLanguage = 'en-GB'; 
                } 
                currentVocabularyPart = essentialsVocabularyData[categoryKey].map((item, index) => ({
                    ...item, 
                    originalIndex: index, 
                    correctCount: item.correctCount || 0 
                })); 
                essentialsOptionsTitle.textContent = `Category: ${categoryKey}`; 
                essentialsCategorySelectionSection.classList.add('hidden'); 
                essentialsCategoryOptionsSection.classList.remove('hidden'); 
            }); 
            essentialsCategoryButtonsContainer.appendChild(button); 
        }); 
    }

    function showPartSelection(gameType) {
        const sourceForParts = isEssentialsMode ? currentVocabularyPart : vocabulary;
        if (sourceForParts.length === 0) { 
            noVocabularyMessage.classList.remove('hidden'); 
            gameArea.classList.remove('hidden'); 
            [partSelectionContainer, matchingGameContainer, multipleChoiceGameContainer, typeTranslationGameContainer, talkToMeGameContainer, fillInTheBlanksGameContainer, findTheWordsGameContainer, gameOverMessage].forEach(el => el.classList.add('hidden')); 
            return; 
        }
        gameTitle.textContent = gameType.charAt(0).toUpperCase() + gameType.slice(1).replace(/([A-Z])/g, ' $1');
        [uploadSection, gameSelectionSection, essentialsCategorySelectionSection, essentialsCategoryOptionsSection, mainSelectionSection].forEach(el => el.classList.add('hidden'));
        gameArea.classList.remove('hidden');
        partSelectionContainer.classList.remove('hidden');
        hideAllGames();
        partButtonsContainer.innerHTML = '';
        const numParts = Math.ceil(sourceForParts.length / ITEMS_PER_PART);
        const fullMixButton = document.createElement('button');
        fullMixButton.className = 'btn part-selection-btn p-3 sm:p-4 text-sm sm:text-md';
        fullMixButton.textContent = `Full Mix (${sourceForParts.length} items)`;
        fullMixButton.addEventListener('click', () => { 
            currentVocabularyPart = [...sourceForParts]; 
            currentPartName = "Full Mix"; 
            startGame(gameType); 
        });
        partButtonsContainer.appendChild(fullMixButton);
        if (!isEssentialsMode && numParts > 1 && sourceForParts.length > ITEMS_PER_PART) {
            for (let i = 0; i < numParts; i++) {
                const start = i * ITEMS_PER_PART;
                const end = start + ITEMS_PER_PART;
                const partVocab = sourceForParts.slice(start, end);
                if (partVocab.length === 0) continue;
                const button = document.createElement('button');
                button.className = 'btn part-selection-btn p-3 sm:p-4 text-sm sm:text-md';
                button.textContent = `Part ${i + 1} (Items ${start + 1}-${Math.min(end, sourceForParts.length)})`;
                button.addEventListener('click', () => { 
                    currentVocabularyPart = partVocab; 
                    currentPartName = `Part ${i + 1}`; 
                    startGame(gameType); 
                });
                partButtonsContainer.appendChild(button);
            }
        }
    }

    function startGame(gameType) {
        if (!audioInitialized) initializeAudio();
        partSelectionContainer.classList.add('hidden');
        resetGameStats();
        switch (gameType) {
            case 'matching': initMatchingGame(); break;
            case 'multipleChoice': initMultipleChoiceGame(); break;
            case 'typeTranslation': initTypeTranslationGame(); break;
            case 'talkToMe': initTalkToMeGame(); break;
            case 'fillInTheBlanks': initFillInTheBlanksGame(); break;
            case 'findTheWords': initFindTheWordsGame(); break;
        }
    }

    // --- HELPER & CORE GAME MECHANICS ---
    function shuffleArray(array) { 
        const newArray = [...array]; 
        for (let i = newArray.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; 
        } 
        return newArray; 
    }
    function normalizeText(text) { 
        return text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); 
    }
    function updateScoreDisplay() { 
        currentScoreDisplay.textContent = `Score: ${currentScore}`; 
        maxScoreDisplay.textContent = `Max Score: ${sessionMaxScore}`; 
    }
            function setupMistakeTracker() { 
                mistakeTrackerDiv.innerHTML = ''; 
                for (let i = 0; i < MAX_MISTAKES; i++) { 
                    const capybaraSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); 
                    capybaraSvg.setAttribute("viewBox", "0 0 60 60"); 
                    capybaraSvg.setAttribute("fill", "currentColor"); 
                    capybaraSvg.classList.add("capybara-life-icon"); 
                    capybaraSvg.innerHTML = ` <path d="M30,15 C18,15 10,23 10,33 C10,43 15,50 22,52 C20,48 20,42 23,40 C25,38 28,38 30,39 C32,38 35,38 37,40 C40,42 40,48 38,52 C45,50 50,43 50,33 C50,23 42,15 30,15 Z M22,28 A2,2 0 0,1 24,30 A2,2 0 0,1 22,32 A2,2 0 0,1 20,30 A2,2 0 0,1 22,28 Z M38,28 A2,2 0 0,1 40,30 A2,2 0 0,1 38,32 A2,2 0 0,1 36,30 A2,2 0 0,1 38,28 Z M30,42 C28,42 27,41 27,40 C27,39 28,38 30,38 C32,38 33,39 33,40 C33,41 32,42 30,42 Z"></path> <ellipse cx="23" cy="25" rx="3" ry="2" fill="#4a2c2a"/> <ellipse cx="37" cy="25" rx="3" ry="2" fill="#4a2c2a"/> <path d="M28,33 Q30,35 32,33" stroke="#4a2c2a" stroke-width="1.5" fill="none" /> `; 
                    mistakeTrackerDiv.appendChild(capybaraSvg); 
                } 
            }
            function updateMistakeDisplay() { 
                const icons = mistakeTrackerDiv.querySelectorAll('.capybara-life-icon'); 
                icons.forEach((icon, index) => icon.classList.toggle('mistake', index < MAX_MISTAKES - mistakesRemaining)); 
            }
            function resetGameStats() { 
                mistakesRemaining = MAX_MISTAKES; 
                updateScoreDisplay(); 
                setupMistakeTracker(); 
                gameOverMessage.classList.add('hidden'); 
            }

            // --- SPEECH & AUDIO ---
            function initializeAudio() {
                if (audioInitialized) return;
                audioInitialized = true;
                console.log("Audio initialized");
            }

            function speakText(text, lang) {
                return new Promise((resolve) => {
                    if ('speechSynthesis' in window && text) {
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = lang;
                        utterance.onend = resolve;
                        utterance.onerror = () => resolve();
                        window.speechSynthesis.speak(utterance);
                    } else {
                        resolve();
                    }
                });
            }

            function initSpeechRecognition() {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.lang = 'en-GB';
                    recognition.interimResults = false;
                    recognition.maxAlternatives = 1;

                    recognition.onresult = (event) => {
                        const speechResult = event.results[0][0].transcript;
                        talkToMeRecognizedText.textContent = speechResult;
                        checkSpeechAnswer(speechResult);
                    };
                    recognition.onerror = (event) => { 
                        speechApiStatus.textContent = `Error: ${event.error}`; 
                        stopListening(); 
                    };
                    recognition.onend = () => { 
                        if (isListening) stopListening(); 
                    };
                } else {
                    speechApiStatus.textContent = "Browser doesn't support speech recognition.";
                    if(listenBtn) listenBtn.disabled = true;
                }
            }

            // --- GAME LOGIC FUNCTIONS ---
            function initMatchingGame() {
                // Initialize round tracking for matching games
                if (!window.matchingGameState) {
                    window.matchingGameState = {
                        currentRound: 1,
                        totalRounds: 3,
                        wrongMatches: [],
                        bonusRoundActive: false,
                        cardsPerRound: 6
                    };
                }
                
                startMatchingRound();
            }
            
            function startMatchingRound() {
                const gameState = window.matchingGameState;
                let gameVocab;
                
                if (gameState.bonusRoundActive) {
                    gameVocab = gameState.wrongMatches;
                    matchingFeedback.textContent = `Bonus Round - Let's try those again!`;
                } else {
                    const startIndex = (gameState.currentRound - 1) * gameState.cardsPerRound;
                    gameVocab = shuffleArray(currentVocabularyPart).slice(startIndex, startIndex + gameState.cardsPerRound);
                    matchingFeedback.textContent = `Round ${gameState.currentRound} of ${gameState.totalRounds}`;
                }
                
                matchedPairs = 0;
                selectedMatchCard = null;
                pairsToMatch = gameVocab.length;
                let cards = [];
                gameVocab.forEach((item, index) => {
                    cards.push({ id: index, type: 'lang1', text: item.lang1, isTargetLang: true });
                    cards.push({ id: index, type: 'lang2', text: item.lang2, isTargetLang: false });
                });

                matchingGameContainer.classList.remove('hidden');
                matchingGrid.innerHTML = '';
                
                // Only show language selector if no language is defined
                if (!hasDefinedLanguage()) {
                    languageSelectionInGameContainer.classList.remove('hidden');
                } else {
                    languageSelectionInGameContainer.classList.add('hidden');
                    // Use the current active language
                    activeTargetStudyLanguage = getCurrentActiveLanguage();
                }
                
                hearItOutLoudToggleBtn.classList.remove('hidden');
                shuffleArray(cards).forEach(cardData => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'game-card card p-2';
                    cardElement.textContent = cardData.text;
                    cardElement.dataset.id = cardData.id;
                    cardElement.dataset.isTargetLang = cardData.isTargetLang;
                    cardElement.addEventListener('click', () => handleMatchCardClick(cardElement));
                    matchingGrid.appendChild(cardElement);
                });
            }

            function getCurrentMatchingVocab() {
                const gameState = window.matchingGameState;
                if (!gameState) return [];
                
                if (gameState.bonusRoundActive) {
                    return gameState.wrongMatches;
                } else {
                    const startIndex = (gameState.currentRound - 1) * gameState.cardsPerRound;
                    return currentVocabularyPart.slice(startIndex, startIndex + gameState.cardsPerRound);
                }
            }

            function handleMatchCardClick(cardElement) {
                if (cardElement.classList.contains('matched') || cardElement === selectedMatchCard) return;

                // Speak target language words when clicked (if enabled and is target language)
                if (hearItOutLoudEnabled && cardElement.dataset.isTargetLang === 'true') {
                    speakText(cardElement.textContent, activeTargetStudyLanguage);
                }

                if (!selectedMatchCard) {
                    selectedMatchCard = cardElement;
                    cardElement.classList.add('selected-match');
                } else {
                    if (selectedMatchCard.dataset.id === cardElement.dataset.id) {
                        [selectedMatchCard, cardElement].forEach(el => {
                            el.classList.add('matched');
                            el.classList.remove('selected-match');
                        });
                        playCorrectMatchSound();
                        
                        // Add 5 points for correct match
                        currentScore += 5;
                        if (currentScore > sessionMaxScore) {
                            sessionMaxScore = currentScore;
                        }
                        updateScoreDisplay();
                        
                        matchedPairs++;
                        if (matchedPairs === pairsToMatch) {
                            const gameState = window.matchingGameState;
                            
                            if (gameState.bonusRoundActive) {
                                matchingFeedback.textContent = "Bonus Round Complete!";
                                // Reset game state
                                window.matchingGameState = null;
                            } else if (gameState.currentRound < gameState.totalRounds) {
                                gameState.currentRound++;
                                matchingFeedback.textContent = `Round ${gameState.currentRound - 1} Complete!`;
                                
                                setTimeout(() => {
                                    startMatchingRound();
                                }, 2000);
                            } else {
                                // All regular rounds complete, check for bonus round
                                if (gameState.wrongMatches.length > 0) {
                                    gameState.bonusRoundActive = true;
                                    matchingFeedback.textContent = "All rounds complete! Starting bonus round...";
                                    
                                    setTimeout(() => {
                                        startMatchingRound();
                                    }, 2000);
                                } else {
                                    matchingFeedback.textContent = "All rounds complete! Perfect game!";
                                    window.matchingGameState = null;
                                }
                            }
                        }
                    } else {
                        // Track wrong matches for bonus round
                        const gameState = window.matchingGameState;
                        if (gameState && !gameState.bonusRoundActive) {
                            // Find the vocabulary items for this mismatch
                            const card1Id = parseInt(selectedMatchCard.dataset.id);
                            const card2Id = parseInt(cardElement.dataset.id);
                            
                            // Add both items to wrong matches if not already there
                            const currentVocab = getCurrentMatchingVocab();
                            if (currentVocab[card1Id] && !gameState.wrongMatches.find(w => w.lang1 === currentVocab[card1Id].lang1)) {
                                gameState.wrongMatches.push(currentVocab[card1Id]);
                            }
                            if (currentVocab[card2Id] && !gameState.wrongMatches.find(w => w.lang1 === currentVocab[card2Id].lang1)) {
                                gameState.wrongMatches.push(currentVocab[card2Id]);
                            }
                        }
                        
                        [selectedMatchCard, cardElement].forEach(el => el.classList.add('incorrect-match-animation'));
                        playIncorrectSound();
                        setTimeout(() => {
                            [selectedMatchCard, cardElement].forEach(el => el.classList.remove('incorrect-match-animation', 'selected-match'));
                            selectedMatchCard = null;
                        }, 400);
                    }
                    if (selectedMatchCard) selectedMatchCard = null;
                }
            }

            function initMultipleChoiceGame() {
                let mcqGameActiveVocab = shuffleArray(currentVocabularyPart);
                currentMcqIndex = 0;
                multipleChoiceGameContainer.classList.remove('hidden');
                
                // Initialize wrong answers tracking
                window.mcqWrongAnswers = [];
                window.mcqBonusRoundActive = false;
                
                // Only show language selector if no language is defined
                if (!hasDefinedLanguage()) {
                    languageSelectionInGameContainer.classList.remove('hidden');
                } else {
                    languageSelectionInGameContainer.classList.add('hidden');
                    // Use the current active language
                    activeTargetStudyLanguage = getCurrentActiveLanguage();
                }
                
                hearItOutLoudToggleBtn.classList.remove('hidden');
                displayNextMcq(mcqGameActiveVocab);
            }

            function displayNextMcq(gameVocab) {
                if (currentMcqIndex >= gameVocab.length) {
                    // Check if we need a bonus round for wrong answers
                    if (window.mcqWrongAnswers && window.mcqWrongAnswers.length > 0 && !window.mcqBonusRoundActive) {
                        window.mcqBonusRoundActive = true;
                        currentMcqIndex = 0;
                        mcqQuestion.textContent = "Bonus Round - Let's try those again!";
                        
                        setTimeout(() => {
                            displayNextMcq(window.mcqWrongAnswers);
                        }, 2000);
                        return;
                    }
                    
                    mcqQuestion.textContent = "Part Complete!";
                    mcqOptions.innerHTML = '';
                    // Reset bonus round tracking
                    window.mcqWrongAnswers = [];
                    window.mcqBonusRoundActive = false;
                    return;
                }
                const currentItem = gameVocab[currentMcqIndex];
                mcqQuestion.textContent = currentItem.lang1;

                // Add click-to-speak functionality to the question
                mcqQuestion.onclick = () => {
                    if (hearItOutLoudEnabled) speakText(currentItem.lang1, currentItem.term_lang || activeTargetStudyLanguage);
                };
                mcqQuestion.classList.add('speakable-question');

                let options = [currentItem.lang2, ...shuffleArray(vocabulary.filter(v => v.lang1 !== currentItem.lang1)).slice(0, 3).map(v => v.lang2)];
                mcqOptions.innerHTML = '';
                shuffleArray(options).forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'btn mcq-option-btn';
                    btn.textContent = opt;
                    btn.onclick = () => checkMcqAnswer(btn, opt === currentItem.lang2, currentItem);
                    // Add TTS for options when double-clicked or right-clicked
                    btn.ondblclick = () => {
                        if (hearItOutLoudEnabled) speakText(opt, 'en-GB'); // Options are in user's language
                    };
                    mcqOptions.appendChild(btn);
                });
            }

            function checkMcqAnswer(button, isCorrect, item) {
                if (mcqAnswered) return;
                mcqAnswered = true;
                button.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');
                
                if (isCorrect) {
                    // Play correct sound and auto-advance
                    playCorrectMatchSound();
                    currentScore += 5;
                    if (currentScore > sessionMaxScore) {
                        sessionMaxScore = currentScore;
                    }
                    updateScoreDisplay();
                    
                    // Auto-advance after 1.5 seconds
                    setTimeout(() => {
                        mcqAnswered = false; 
                        currentMcqIndex++; 
                        mcqFeedback.textContent = ''; // Clear any previous feedback
                        displayNextMcq(currentVocabularyPart); 
                        nextMcqBtn.classList.add('hidden');
                    }, 1500);
                } else {
                    // Track wrong answer for bonus round
                    if (!window.mcqWrongAnswers) window.mcqWrongAnswers = [];
                    if (!window.mcqWrongAnswers.find(w => w.lang1 === item.lang1)) {
                        window.mcqWrongAnswers.push(item);
                    }
                    
                    playIncorrectSound();
                    mcqFeedback.textContent = `Correct: ${item.lang2}`;
                    mcqOptions.querySelectorAll('.mcq-option-btn').forEach(btn => {
                        if (btn.textContent === item.lang2) btn.classList.add('correct-answer');
                    });
                    nextMcqBtn.classList.remove('hidden');
                }
            }

            function initTypeTranslationGame() {
                let typeTransGameActiveVocab = shuffleArray(currentVocabularyPart);
                currentTypeTranslationIndex = 0;
                typeTranslationGameContainer.classList.remove('hidden');
                
                // Only show language selector if no language is defined
                if (!hasDefinedLanguage()) {
                    languageSelectionInGameContainer.classList.remove('hidden');
                } else {
                    languageSelectionInGameContainer.classList.add('hidden');
                    // Use the current active language
                    activeTargetStudyLanguage = getCurrentActiveLanguage();
                }
                
                hearItOutLoudToggleBtn.classList.remove('hidden');
                displayNextTypeTranslation(typeTransGameActiveVocab);
            }

            function displayNextTypeTranslation(gameVocab) {
                if (currentTypeTranslationIndex >= gameVocab.length) {
                    typeTranslationPhrase.textContent = "Part Complete!";
                    typeTranslationInput.style.display = 'none';
                    return;
                }
                const item = gameVocab[currentTypeTranslationIndex];
                typeTranslationPhrase.textContent = item.lang2;

                // Add click-to-speak functionality to the phrase (user's language)
                typeTranslationPhrase.onclick = () => {
                    if (hearItOutLoudEnabled) speakText(item.lang2, 'en-GB');
                };
                typeTranslationPhrase.classList.add('speakable-question');

                typeTranslationInput.value = '';
                typeTranslationFeedback.textContent = '';
                nextTypeTranslationBtn.classList.add('hidden');
            }

            function checkTypeTranslation() {
                const item = currentVocabularyPart[currentTypeTranslationIndex];
                const isCorrect = typeTranslationInput.value.trim().toLowerCase() === item.lang1.toLowerCase();
                typeTranslationFeedback.textContent = isCorrect ? "Correct!" : `Correct: ${item.lang1}`;
                nextTypeTranslationBtn.classList.remove('hidden');
            }

            function initFillInTheBlanksGame() {
                fillInTheBlanksGameContainer.classList.remove('hidden');
                
                // Only show language selector if no language is defined
                if (!hasDefinedLanguage()) {
                    languageSelectionInGameContainer.classList.remove('hidden');
                } else {
                    languageSelectionInGameContainer.classList.add('hidden');
                    // Use the current active language
                    activeTargetStudyLanguage = getCurrentActiveLanguage();
                }
                
                hearItOutLoudToggleBtn.classList.remove('hidden');
                fillInTheBlanksSentence.textContent = "Fill in the blanks is not yet implemented.";
            }

            function initTalkToMeGame() {
                talkToMeGameContainer.classList.remove('hidden');
                
                // Only show language selector if no language is defined
                if (!hasDefinedLanguage()) {
                    languageSelectionInGameContainer.classList.remove('hidden');
                } else {
                    languageSelectionInGameContainer.classList.add('hidden');
                    // Use the current active language
                    activeTargetStudyLanguage = getCurrentActiveLanguage();
                }
                
                hearItOutLoudToggleBtn.classList.remove('hidden');
                let talkToMeActiveVocab = shuffleArray(currentVocabularyPart);
                currentTalkToMeIndex = 0;
                displayNextTalkToMe(talkToMeActiveVocab);
            }

            function displayNextTalkToMe(gameVocab) {
                if (currentTalkToMeIndex >= gameVocab.length) {
                    talkToMePhraseText.textContent = "Part Complete!";
                    return;
                }
                const item = gameVocab[currentTalkToMeIndex];
                talkToMePhraseText.textContent = item.lang1;
                talkToMeRecognizedText.textContent = "...";
                talkToMeFeedback.textContent = "";
                nextTalkToMeBtn.classList.add('hidden');

                // Show translation reference
                talkToMeReferenceContainer.classList.remove('hidden');
                talkToMeReferenceDisplay.textContent = item.lang2;

                // Add click-to-speak functionality to the phrase
                talkToMePhraseToRead.onclick = () => {
                    speakText(item.lang1, item.term_lang || activeTargetStudyLanguage);
                };

                // Automatically speak the word when displayed
                setTimeout(() => {
                    speakText(item.lang1, item.term_lang || activeTargetStudyLanguage);
                }, 300);
            }

            function startListening() {
                if (!recognition || isListening) return;
                recognition.lang = activeTargetStudyLanguage;
                recognition.start();
                isListening = true;
                listenBtnText.textContent = 'Listening...';
            }

            function stopListening() {
                if (!recognition || !isListening) return;
                recognition.stop();
                isListening = false;
                listenBtnText.textContent = 'Start Listening';
            }

            function checkSpeechAnswer(spokenText) {
                const item = currentVocabularyPart[currentTalkToMeIndex];
                const isCorrect = normalizeText(spokenText) === normalizeText(item.lang1);

                if (isCorrect) {
                    talkToMeFeedback.textContent = "Correct! Well done!";
                    talkToMeFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-green-600";
                    playCorrectMatchSound();

                    // Auto-advance after a short delay
                    setTimeout(() => {
                        currentTalkToMeIndex++;
                        displayNextTalkToMe(currentVocabularyPart);
                    }, 1500);
                } else {
                    talkToMeFeedback.textContent = "Not quite, try again or click the word to hear it again.";
                    talkToMeFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-orange-600";
                    playIncorrectSound();
                }

                nextTalkToMeBtn.classList.remove('hidden');
            }

            function initFindTheWordsGame() {
                findTheWordsGameContainer.classList.remove('hidden');
                
                // Only show language selector if no language is defined
                if (!hasDefinedLanguage()) {
                    languageSelectionInGameContainer.classList.remove('hidden');
                } else {
                    languageSelectionInGameContainer.classList.add('hidden');
                    // Use the current active language
                    activeTargetStudyLanguage = getCurrentActiveLanguage();
                }
                
                hearItOutLoudToggleBtn.classList.remove('hidden');
                findWordsSessionPool = shuffleArray(currentVocabularyPart);
                currentFindWordsRound = 0;
                startFindTheWordsRound(findWordsSessionPool);
            }

            // Helper: Speak the three target words, respecting current language
async function speakFindTheWordsTargets(words, lang) {
    for (const w of words) {
        await speakText(w.lang1, w.term_lang || lang);
        await new Promise(res => setTimeout(res, 350));
    }
}

// Call this when starting a round or when replay is requested
async function startFindTheWordsRound(pool) {
    if (currentFindWordsRound >= MAX_FIND_WORDS_ROUNDS || pool.length < WORDS_PER_FIND_WORDS_TARGET) {
        findTheWordsInstructions.textContent = "Game Complete!";
        findTheWordsGrid.innerHTML = '';
        return;
    }
    currentFindWordsRound++;
    findWordsTargetWords = pool.splice(0, WORDS_PER_FIND_WORDS_TARGET);
    let distractors = shuffleArray(vocabulary.filter(v => !findWordsTargetWords.includes(v))).slice(0, WORDS_PER_FIND_WORDS_DISPLAY - WORDS_PER_FIND_WORDS_TARGET);
    let findWordsCurrentChoices = shuffleArray([...findWordsTargetWords, ...distractors]);
    findTheWordsGrid.innerHTML = '';
    findWordsCurrentChoices.forEach(item => {
        const card = document.createElement('div');
        card.className = 'game-card card p-2';
        card.textContent = item.lang1;
        card.setAttribute('data-lang', item.term_lang || activeTargetStudyLanguage);
        card.onclick = () => {
            speakText(item.lang1, item.term_lang || activeTargetStudyLanguage);
            toggleFindWordSelection(card, item);
        };
        findTheWordsGrid.appendChild(card);
    });
    findTheWordsRoundCounter.textContent = `Round: ${currentFindWordsRound}/${MAX_FIND_WORDS_ROUNDS}`;
    await speakFindTheWordsTargets(findWordsTargetWords, activeTargetStudyLanguage);
}

            function toggleFindWordSelection(card, item) {
                card.classList.toggle('selected-find-word');
                const index = findWordsSelectedWords.findIndex(i => i.lang1 === item.lang1);
                if (index > -1) findWordsSelectedWords.splice(index, 1);
                else findWordsSelectedWords.push(item);
                sendFindTheWordsBtn.disabled = findWordsSelectedWords.length === 0;
            }

            function checkFindTheWordsAnswer() {
                const correctCount = findWordsSelectedWords.filter(s => findWordsTargetWords.includes(s)).length;
                findTheWordsFeedback.textContent = `You found ${correctCount} of ${findWordsTargetWords.length}.`;
                nextFindTheWordsRoundBtn.classList.remove('hidden');
            }

            // --- EVENT LISTENERS ---
    // Add this in your event listeners section
document.getElementById('debugDbBtn')?.addEventListener('click', async function() {
  console.clear(); // Clear console for cleaner output
  console.log('🔍 DATABASE DEBUG STARTED');
  
  try {
    // 1. Check Supabase connection
    console.log('Supabase client exists:', !!supabaseClient);
    
    // 2. Check authentication
    const { data: authData } = await supabaseClient.auth.getUser();
    console.log('User authenticated:', !!authData.user);
    if (authData.user) {
      console.log('User ID:', authData.user.id);
      console.log('User email:', authData.user.email);
    }
    
    // 3. Try a manual query to the database
    console.log('Attempting direct database query...');
    const { data, error } = await supabaseClient
      .from('notes')
      .select('*')
      .limit(10);
      
    if (error) {
      console.error('Query error:', error);
    } else {
      console.log('Query successful, returned items:', data?.length);
      console.log('Sample data:', data);
      
      // 4. Try to manually populate the vocabulary array
      if (data && data.length > 0) {
        try {
          window.vocabulary = data.map((note, index) => ({
            lang1: note.term,
            lang2: note.definition,
            originalIndex: index,
            correctCount: 0
          }));
          
          console.log('Manually set vocabulary array:', window.vocabulary);
          
          // Force UI update
          if (window.vocabulary.length > 0) {
            alert(`Successfully loaded ${window.vocabulary.length} items manually!`);
            // Try to trigger game selection if appropriate
            if (typeof showGameSelection === 'function') {
              showGameSelection();
            }
          }
        } catch (e) {
          console.error('Failed to manually set vocabulary:', e);
        }
      }
    }
  } catch (e) {
    console.error('Debug function error:', e);
  }
});
            authToggleText.addEventListener('click', (e) => { if (e.target.matches('.toggle-auth-link')) { e.preventDefault(); toggleAuthMode(); } });
            authForm.addEventListener('submit', async (e) => { 
                e.preventDefault(); 
                const email = document.getElementById('emailInput').value.trim(); 
                const password = document.getElementById('passwordInput').value.trim(); 
                authError.textContent = ''; 

                console.log('Auth form submitted:', isSignUp ? 'Sign Up' : 'Login', 'Email:', email);

                try { 
                    if (isSignUp) { 
                        console.log('Attempting sign up...');
                        const { error } = await supabaseClient.auth.signUp({ email, password }); 
                        if (error) { 
                            console.error('Sign up error:', error);
                            authError.textContent = error.message; 
                        } else { 
                            console.log('Sign up successful');
                            alert('Sign up successful! Please check your email to confirm your account.'); 
                            toggleAuthMode(); 
                        } 
                    } else { 
                        console.log('Attempting login...');
                        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); 
                        if (error) { 
                            console.error('Login error:', error);
                            authError.textContent = error.message; 
                        } else {
                            console.log('Login successful, user:', data.user?.id);
                            
                            // Call session enforcement after successful login
                            await enforceSignOutOtherDevices();
                        }
                    } 
                } catch (err) { 
                    console.error('Unexpected auth error:', err);
                    authError.textContent = 'Unexpected error. Try again.'; 
                } 
            });
            googleLoginBtn.addEventListener('click', async () => { 
                const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google' }); 
                if (error) { authError.textContent = error.message; } 
            });
            // Ensure logout button is properly initialized with error handling
            if (logoutBtn) {
                // Remove any existing listeners first to prevent duplicates
                logoutBtn.replaceWith(logoutBtn.cloneNode(true));
                const newLogoutBtn = document.getElementById('logoutBtn');
                
                newLogoutBtn.addEventListener('click', async (e) => { 
                    e.preventDefault();
                    console.log('Logout button clicked');

                    try {
                        console.log('Attempting to sign out and clear all sessions...');
                        
                        // Get current user before signing out
                        const { data: { user } } = await supabaseClient.auth.getUser();
                        
                        if (user) {
                            // Clear the active session from the database
                            console.log('Clearing active session from database...');
                            await supabaseClient
                                .from('profiles')
                                .update({ 
                                    active_session_id: null,
                                    last_active: new Date().toISOString().slice(0, 19).replace('T', ' ')
                                })
                                .eq('id', user.id);
                        }
                        
                        // Sign out from Supabase (clears all sessions)
                        const { error } = await supabaseClient.auth.signOut({ scope: 'global' }); 

                        if (error) {
                            console.error('Logout error from Supabase:', error);
                        } else {
                            console.log('Successfully signed out from all sessions');
                        }

                        // Clear all local storage
                        localStorage.removeItem('current_session_id');
                        localStorage.removeItem('learning_language');
                        
                        // Clear local state regardless of Supabase response
                        vocabulary = [];
                        isEssentialsMode = false;
                        currentVocabularyPart = [];

                        // Force reload to ensure clean state
                        console.log('Reloading page to ensure clean state');
                        window.location.reload(); 
                    } catch (error) {
                        console.error('Unexpected logout error:', error);
                        // Force reload anyway to ensure clean state
                        localStorage.clear();
                        vocabulary = [];
                        window.location.reload();
                    }
                });
            } else {
                console.error('Logout button not found in DOM');
            }

            addNotesBtn.addEventListener('click', () => {
                // If user has existing vocabulary, show notes management interface
                if (vocabulary && vocabulary.length > 0) {
                    initializeNotesManagement();
                } else {
                    // If no vocabulary, show main selection (upload options)
                    showMainSelection();
                }
            });

            // Add refresh vocabulary button functionality
            if (refreshVocabBtn) {
                refreshVocabBtn.addEventListener('click', async () => {
                    console.log('🔄 Manual vocabulary refresh requested');
                    refreshVocabBtn.disabled = true;
                    refreshVocabBtn.textContent = '⏳ Refreshing...';
                    
                    try {
                        const hasNotes = await fetchNotes();
                        if (hasNotes) {
                            alert(`Successfully loaded ${vocabulary.length} notes from database!`);
                        } else {
                            alert('No notes found in database or refresh failed. Please check the console for details.');
                        }
                    } catch (error) {
                        console.error('💥 Manual refresh error:', error);
                        alert('Refresh failed: ' + error.message);
                    } finally {
                        refreshVocabBtn.disabled = false;
                        refreshVocabBtn.textContent = '🔄 Refresh';
                    }
                });
            } else {
                console.error('Refresh vocabulary button not found in DOM');
            }
            
            // Live Notes event listeners
            liveNotesBtn.addEventListener('click', initializeLiveNotes);
            closeLiveNotesBtn.addEventListener('click', closeLiveNotes);
            newLineBtn.addEventListener('click', addNewNoteLine);
            previousLineBtn.addEventListener('click', goToPreviousLine);
            clearAllBtn.addEventListener('click', clearAllLiveNotes);
            manualSaveBtn.addEventListener('click', () => saveLiveNotes(true));
            
            // Notes Management event listeners
            const closeNotesManagementBtn = document.getElementById('closeNotesManagementBtn');
            const notesUploadCsvBtn = document.getElementById('notesUploadCsvBtn');
            const notesStudyEssentialsBtn = document.getElementById('notesStudyEssentialsBtn');
            
            if (closeNotesManagementBtn) {
                closeNotesManagementBtn.addEventListener('click', closeNotesManagement);
            }
            
            if (notesUploadCsvBtn) {
                notesUploadCsvBtn.addEventListener('click', () => {
                    closeNotesManagement();
                    showMainSelection();
                    // Trigger upload section
                    setTimeout(() => {
                        mainSelectionSection.classList.add('hidden');
                        uploadSection.classList.remove('hidden');
                    }, 100);
                });
            }
            
            if (notesStudyEssentialsBtn) {
                notesStudyEssentialsBtn.addEventListener('click', () => {
                    closeNotesManagement();
                    showMainSelection();
                    // Trigger essentials section
                    setTimeout(() => {
                        mainSelectionSection.classList.add('hidden');
                        essentialsCategorySelectionSection.classList.remove('hidden');
                        isEssentialsMode = true;
                        populateEssentialsCategoryButtons();
                    }, 100);
                });
            }
            showUploadSectionBtn.addEventListener('click', () => { mainSelectionSection.classList.add('hidden'); uploadSection.classList.remove('hidden'); });
            backToMainSelectionFromUploadBtn.addEventListener('click', showMainSelection);
            showEssentialsSectionBtn.addEventListener('click', () => { mainSelectionSection.classList.add('hidden'); essentialsCategorySelectionSection.classList.remove('hidden'); isEssentialsMode = true; populateEssentialsCategoryButtons(); });
            backToMainSelectionFromEssentialsBtn.addEventListener('click', showMainSelection);
            backToEssentialsCategoriesBtn.addEventListener('click', () => { essentialsCategoryOptionsSection.classList.add('hidden'); essentialsCategorySelectionSection.classList.remove('hidden'); });
            reviewEssentialsCategoryBtn.addEventListener('click', () => { initializeAudio(); essentialsCategoryOptionsSection.classList.add('hidden'); gameArea.classList.remove('hidden'); startGame('matching'); });
            playGamesWithEssentialsBtn.addEventListener('click', () => { initializeAudio(); essentialsCategoryOptionsSection.classList.add('hidden'); showGameSelection(); });
            backToGameSelectionBtn.addEventListener('click', showGameSelection);
            backToSourceSelectionBtn.addEventListener('click', () => { gameSelectionSection.classList.add('hidden'); if (isEssentialsMode) { essentialsCategoryOptionsSection.classList.remove('hidden'); } else { showMainSelection(); } });
            matchingBtn.addEventListener('click', () => { initializeAudio(); showPartSelection('matching'); });
            multipleChoiceBtn.addEventListener('click', () => { initializeAudio(); showPartSelection('multipleChoice'); });
            typeTranslationBtn.addEventListener('click', () => { initializeAudio(); showPartSelection('typeTranslation'); });
            talkToMeBtn.addEventListener('click', () => { initializeAudio(); showPartSelection('talkToMe'); });
            fillInTheBlanksBtn.addEventListener('click', () => { initializeAudio(); showPartSelection('fillInTheBlanks'); });
            findTheWordsBtn.addEventListener('click', () => { initializeAudio(); showPartSelection('findTheWords'); });
            uploadBtn.addEventListener('click', () => handleFileUpload());
            csvFileInput.addEventListener('change', (e) => {
                // Only process file changes if user is not in the middle of authentication
                // and if there's actually a file selected
                if (!isAuthenticating && e.target.files.length > 0) {
                    console.log('csvFileInput change event: Processing file upload');
                    handleFileUpload();
                } else {
                    console.log('csvFileInput change event: Ignored (isAuthenticating:', isAuthenticating, 'files.length:', e.target.files.length, ')');
                }
            });
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover-active'); });
            dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover-active'); });
            dropZone.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover-active'); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleFileUpload(e.dataTransfer.files[0]); } });

            // Game specific event listeners
            if (checkTypeTranslationBtn) checkTypeTranslationBtn.addEventListener('click', checkTypeTranslation);
            if (listenBtn) listenBtn.addEventListener('click', startListening);
            if (sendFindTheWordsBtn) sendFindTheWordsBtn.addEventListener('click', checkFindTheWordsAnswer);
            if (nextMcqBtn) nextMcqBtn.addEventListener('click', () => { 
                mcqAnswered = false; 
                currentMcqIndex++; 
                displayNextMcq(currentVocabularyPart); 
                nextMcqBtn.classList.add('hidden'); 
            });
            if (nextTypeTranslationBtn) nextTypeTranslationBtn.addEventListener('click', () => { 
                typeTranslationAnswered = false; 
                currentTypeTranslationIndex++; 
                displayNextTypeTranslation(currentVocabularyPart); 
                nextTypeTranslationBtn.classList.add('hidden'); 
            });
            if (nextTalkToMeBtn) nextTalkToMeBtn.addEventListener('click', () => { 
                currentTalkToMeIndex++; 
                displayNextTalkToMe(currentVocabularyPart); 
                nextTalkToMeBtn.classList.add('hidden'); 
            });

            // Replay button for TTS
replayFindTheWordsAudioBtn.onclick = () => speakFindTheWordsTargets(findWordsTargetWords, activeTargetStudyLanguage);

// Next round button
nextFindTheWordsRoundBtn.onclick = () => startFindTheWordsRound(findWordsSessionPool);

// Update card language tags if the selector changes
if (languageSelectorInGame) {
    languageSelectorInGame.addEventListener('change', (e) => {
        activeTargetStudyLanguage = e.target.value;
        document.querySelectorAll('#findTheWordsGrid .game-card').forEach(card => {
            card.setAttribute('data-lang', activeTargetStudyLanguage);
        });
    });
}

            // --- SPEECH & AUDIO ---
            // === PATCHED AUDIO LOGIC ===
            let backgroundMusicSynth, correctMatchSynth, incorrectBuzzSynth, notebookLostSynth, musicPart;
            let musicPlaying = false;
            let hearItOutLoudEnabled = true;

            function initializeAudio() {
                if (audioInitialized) return;
                Tone.start().then(() => {
                    audioInitialized = true;
                    backgroundMusicSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1 }, volume: -28 }).toDestination();
                    const vivaldiSpringMotif = [ 
                        { time: "0:0", note: "E4", duration: "4n" }, { time: "0:1", note: "E4", duration: "4n" }, { time: "0:2", note: "E4", duration: "4n" }, { time: "0:3", note: "C#5", duration: "4n" },
                        { time: "1:0", note: "D#5", duration: "4n" }, { time: "1:1", note: "D#5", duration: "4n" }, { time: "1:2", note: "D#5", duration: "4n" }, { time: "1:3", note: "B4", duration: "4n" },
                        { time: "2:0", note: "E4", duration: "4n" }, { time: "2:1", note: "E4", duration: "4n" }, { time: "2:2", note: "E4", duration: "4n" }, { time: "2:3", note: "C#5", duration: "4n" },
                        { time: "3:0", note: "D#5", duration: "4n" }, { time: "3:1", note: "D#5", duration: "4n" }, { time: "3:2", note: "B4", duration: "4n" }, { time: "3:3", note: "E4", duration: "4n" }
                    ];
                    musicPart = new Tone.Part((time, value) => backgroundMusicSynth.triggerAttackRelease(value.note, value.duration, time), vivaldiSpringMotif).start(0);
                    musicPart.loop = true; musicPart.loopEnd = "4m";
                    correctMatchSynth = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 }, volume: -12 }).toDestination();
                    incorrectBuzzSynth = new Tone.NoiseSynth ({ noise: { type: "pink" }, envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 }, volume: -18 }).toDestination();
                    notebookLostSynth = new Tone.MonoSynth({ oscillator: { type: "sawtooth" }, filter: { Q: 2, type: "lowpass", rolloff: -24 }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 }, filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.2, baseFrequency: 200, octaves: 2 }, volume: -15 }).toDestination();
                    updateMusicButton();
                    if(musicPlaying && Tone.Transport.state !== "started") Tone.Transport.start();
                    else if (!musicPlaying && Tone.Transport.state === "started") Tone.Transport.pause();
                }).catch(e => console.error("Failed to start audio context:", e));
            }

            function toggleMusic() {
                if (!audioInitialized) { initializeAudio(); musicPlaying = !musicPlaying; return; }
                musicPlaying = !musicPlaying;
                if (musicPlaying && Tone.Transport.state !== "started") Tone.Transport.start();
                else if (!musicPlaying && Tone.Transport.state === "started") Tone.Transport.pause();
                updateMusicButton();
            }
            function updateMusicButton() { 
                if (musicPlaying) { 
                    musicIconOn.classList.remove('hidden'); 
                    musicIconOff.classList.add('hidden'); 
                    musicStatusText.textContent = "Music: ON"; 
                } else { 
                    musicIconOn.classList.add('hidden'); 
                    musicIconOff.classList.remove('hidden'); 
                    musicStatusText.textContent = "Music: OFF"; 
                } 
            }
            function playCorrectMatchSound() { if (audioInitialized && correctMatchSynth) { correctMatchSynth.triggerAttackRelease("C5", "8n", Tone.now()); correctMatchSynth.triggerAttackRelease("G5", "4n", Tone.now() + 0.12); } }
            function playIncorrectSound() {  if (audioInitialized && incorrectBuzzSynth) { incorrectBuzzSynth.triggerAttackRelease("0.2n"); } }
            function playNotebookLostSound() { if (audioInitialized && notebookLostSynth) { notebookLostSynth.triggerAttackRelease("C3", "0.3n"); } }

            function speakText(text, lang) {
                return new Promise((resolve) => {
                    if ('speechSynthesis' in window && text) {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = lang || activeTargetStudyLanguage || 'en-GB';
                        utterance.onend = resolve;
                        utterance.onerror = () => resolve();
                        window.speechSynthesis.speak(utterance);
                    } else {
                        resolve();
                    }
                });
            }

            // --- PATCH: Also call initializeAudio() on all game buttons (already present in your code, leave as is) ---

            // Music toggle functionality
            musicToggleBtn.addEventListener('click', toggleMusic);

            // Hear it out loud toggle functionality  
            hearItOutLoudToggleBtn.addEventListener('click', () => {
                hearItOutLoudEnabled = !hearItOutLoudEnabled;
                updateHearItOutLoudButton();
            });

            function updateHearItOutLoudButton() {
                if (hearItOutLoudToggleBtn && hearItOutLoudBtnText) {
                    hearItOutLoudBtnText.textContent = `Hear: ${hearItOutLoudEnabled ? 'ON' : 'OFF'}`;
                    hearItOutLoudToggleBtn.classList.toggle('active', hearItOutLoudEnabled); 
                }
            }


            // --- INITIALIZATION ---
            
            // Ensure clean initial state
            console.log('🔧 Initializing app - resetting state...');
            isAuthenticating = false;
            vocabulary = [];
            
            // Check if Supabase is available before setting up auth
            if (supabaseClient) {
                console.log('🔐 Supabase client available, setting up authentication...');
                
                supabaseClient.auth.onAuthStateChange(async (event, session) => {
                    console.log('🔐 Auth state changed:', event, session ? 'user logged in' : 'user logged out');
                    console.log('🔐 Event details:', { event, userId: session?.user?.id, email: session?.user?.email });

                    if (session) {
                        console.log('✅ User session found, setting up app...');
                        console.log('✅ Session details:', { userId: session.user?.id, email: session.user?.email });
                        isAuthenticating = true; // Prevent file upload during auth
                        
                        // Add session validation check - but skip for fresh logins
                        if (event !== 'SIGNED_IN') {
                            const isValidSession = await validateSessionIsActive();
                            if (!isValidSession) {
                                console.log('❌ Session validation failed, stopping app setup');
                                return;
                            }
                        } else {
                            console.log('✅ Fresh login detected, skipping session validation');
                        }
                        
                        // Clear any existing file input to prevent unwanted triggers
                        if (csvFileInput) {
                            csvFileInput.value = '';
                        }
                        
                        loginSection.classList.add('hidden');
                        appContent.classList.remove('hidden');

                        try {
                            console.log('📊 Starting fetchNotes() call...');
                            console.log('📊 Current vocabulary state before fetch:', { 
                                vocabularyLength: vocabulary.length, 
                                vocabularyType: typeof vocabulary,
                                vocabularyIsArray: Array.isArray(vocabulary)
                            });
                            
                            const fetchStartTime = Date.now();
                            const hasNotes = await fetchNotes();
                            const fetchDuration = Date.now() - fetchStartTime;
                            
                            console.log('📊 fetchNotes completed in', fetchDuration, 'ms');
                            console.log('📊 fetchNotes result:', { 
                                hasNotes, 
                                vocabularyLength: vocabulary.length,
                                vocabularyType: typeof vocabulary,
                                vocabularyIsArray: Array.isArray(vocabulary)
                            });
                            console.log('📊 csvUploadedTargetLanguage is now:', csvUploadedTargetLanguage);

                            // More robust check - wait a moment for UI to settle
                            await new Promise(resolve => setTimeout(resolve, 100));

                            console.log('🧪 Final vocabulary check:', {
                                vocabulary,
                                isArray: Array.isArray(vocabulary),
                                length: vocabulary?.length,
                                hasContent: vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0
                            });

                            // Enhanced check for existing vocabulary
                            if (vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0) {
                                console.log('✅ User has existing vocabulary (' + vocabulary.length + ' notes), redirecting to game selection');
                                console.log('✅ Sample vocabulary entries:', vocabulary.slice(0, 3));
                                
                                // Ensure we're not in essentials mode for user's own vocabulary
                                isEssentialsMode = false;
                                
                                // Hide all sections first
                                [mainSelectionSection, uploadSection, essentialsCategorySelectionSection, essentialsCategoryOptionsSection].forEach(el => {
                                    if (el) el.classList.add('hidden');
                                });
                                
                                // Go directly to games section
                                console.log('🎮 Calling showGameSelection()...');
                                showGameSelection();
                            } else {
                                console.log('❌ User has no vocabulary, showing main selection (upload section)');
                                console.log('❌ Vocabulary state:', { vocabulary, length: vocabulary?.length, type: typeof vocabulary });
                                console.log('🏠 Calling showMainSelection()...');
                                showMainSelection();
                            }
                        } catch (error) {
                            console.error('💥 Error during app initialization:', error);
                            console.error('💥 Error message:', error.message);
                            console.error('💥 Error stack:', error.stack);
                            // Fallback to main selection on error
                            console.log('🏠 Falling back to main selection due to error');
                            showMainSelection();
                        } finally {
                            // ALWAYS re-enable file upload after authentication, even if there were errors
                            isAuthenticating = false;
                            console.log('✅ Authentication process completed, file upload re-enabled');
                        }
                    } else {
                        console.log('❌ No user session, showing login');
                        isAuthenticating = false; // Reset flag on logout
                        loginSection.classList.remove('hidden');
                        appContent.classList.add('hidden');
                        vocabulary = [];
                        
                        // Clear file input on logout to prevent issues
                        if (csvFileInput) {
                            csvFileInput.value = '';
                        }
                    }
                });

                // Check current session on page load
                console.log('🔍 Checking for existing session on page load...');
                
                supabaseClient.auth.getSession()
                    .then(({ data: { session } }) => {
                        console.log('🔍 Initial session check result:', session ? 'session found' : 'no session');
                        if (!session) {
                            console.log('❌ No active session found, showing login');
                            isAuthenticating = false; // Ensure flag is reset
                            loginSection.classList.remove('hidden');
                            appContent.classList.add('hidden');
                        }
                    }).catch(error => {
                        console.error('💥 Error checking session:', error);
                        console.error('💥 Error details:', error.message);
                        isAuthenticating = false; // Ensure flag is reset on error
                        loginSection.classList.remove('hidden');
                        appContent.classList.add('hidden');
                });
            } else {
                console.error('❌ Supabase not available - authentication will not work');
                // Fallback: ensure login is shown when Supabase is not available
                loginSection.classList.remove('hidden');
                appContent.classList.add('hidden');
                // Disable login functionality
                if (authForm) {
                    authForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        authError.textContent = 'Authentication service is currently unavailable.';
                    });
                }
                if (googleLoginBtn) {
                    googleLoginBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        authError.textContent = 'Google login is currently unavailable.';
                    });
                }
            }

            // Initialize session validation if Supabase is available
            if (supabaseClient) {
                setupSessionValidation();
            }

            // Initialize other components
            setupMistakeTracker(); 
            updateScoreDisplay();
            initSpeechRecognition();

            // Language selector event listeners
            if (targetLanguageSelector) {
                targetLanguageSelector.addEventListener('change', (e) => {
                    csvUploadedTargetLanguage = e.target.value;
                    activeTargetStudyLanguage = e.target.value;
                    console.log('🌐 CSV Target language changed to:', csvUploadedTargetLanguage);
                });
            }

            if (liveNotesLanguageSelector) {
                liveNotesLanguageSelector.addEventListener('change', (e) => {
                    // Update the active language when live notes modal is open
                    if (!liveNotesModal?.classList.contains('hidden')) {
                        activeTargetStudyLanguage = e.target.value;
                        console.log('🌐 Live notes language changed to:', activeTargetStudyLanguage);
                    }
                });
            }

        });
