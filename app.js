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
            
            // 2. Get authenticated user with timeout
            console.log('🔐 Checking authentication...');
            const authPromise = supabaseClient.auth.getUser();
            const authTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Authentication timeout after 5 seconds')), 5000)
            );
            
            const { data: { user }, error: userError } = await Promise.race([authPromise, authTimeoutPromise]);
            if (userError || !user) {
                console.error('❌ Authentication error:', userError || 'No user found');
                return false;
            }
            console.log('✅ Authenticated as:', user.email);
            
            // 3. Test a simple query with timeout
            console.log('📡 Testing direct database query...');
            
            const queryPromise = supabaseClient
                .from('notes')
                .select('count')
                .limit(1);
                
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout after 8 seconds')), 8000)
            );
            
            const result = await Promise.race([queryPromise, timeoutPromise]);
            
            if (result.error) {
                console.error('❌ Database error:', result.error);
                return false;
            }
            
            console.log('✅ Database connection successful:', result.data);
            return true;
        } catch (err) {
            console.error('💥 Database connection test failed:', err.message || err);
            return false;
        }
    }

    // Replace the original fetchNotes function with this simplified version
// Enhanced fetchNotes function with guaranteed data population - now deck-aware
async function fetchNotes() {
    // Use the new deck-aware function with current deck selection
    return await fetchNotesByDeck(currentlySelectedDeckId);
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

    // --- DECK MANAGEMENT FUNCTIONS ---
    
    // Ensure note_sets table exists and migrate existing notes
    async function ensureNoteSetsTableExists() {
        console.log('🔧 Ensuring note_sets table exists...');
        
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return false;
            
            // Check if note_sets table exists by trying to query it
            const { data: testDecks, error: testError } = await supabaseClient
                .from('note_sets')
                .select('id')
                .limit(1);
            
            if (testError && testError.code === '42P01') {
                // Table doesn't exist - this means we need to use the database as-is
                // Since we can't create tables via API, we'll work without the deck structure initially
                console.log('⚠️ note_sets table does not exist - working in compatibility mode');
                return false;
            }
            
            if (testError) {
                console.error('❌ Error checking note_sets table:', testError);
                return false;
            }
            
            console.log('✅ note_sets table exists');
            return true;
            
        } catch (err) {
            console.error('💥 Error in ensureNoteSetsTableExists:', err);
            return false;
        }
    }
    
    // Fetch all decks for the current user
    async function fetchUserDecks() {
        console.log('🗂️ Fetching user decks...');
        
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                console.error('❌ No user authenticated');
                return [];
            }
            
            // Check if note_sets table exists first
            const tableExists = await ensureNoteSetsTableExists();
            if (!tableExists) {
                // Return empty array if table doesn't exist - will trigger welcome modal
                return [];
            }
            
            const { data, error } = await supabaseClient
                .from('note_sets')
                .select('*, notes_count:notes(count)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Error fetching decks:', error);
                return [];
            }
            
            // Process the count data
            const decksWithCounts = data?.map(deck => ({
                ...deck,
                notes_count: deck.notes_count?.[0]?.count || 0
            })) || [];
            
            console.log('✅ Fetched decks:', decksWithCounts);
            return decksWithCounts;
        } catch (err) {
            console.error('💥 Error in fetchUserDecks:', err);
            return [];
        }
    }
    
    // Create a new deck
    async function createDeck(deckName, language, definitionLang = 'EN') {
        console.log('🆕 Creating new deck:', deckName, language, 'Definition lang:', definitionLang);
        
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                console.error('❌ No user authenticated');
                return null;
            }
            
            // Check if note_sets table exists
            const tableExists = await ensureNoteSetsTableExists();
            if (!tableExists) {
                // If table doesn't exist, create a default deck record in localStorage for now
                const defaultDeck = {
                    id: 'default',
                    name: deckName,
                    language: language,
                    user_id: user.id,
                    created_at: new Date().toISOString(),
                    notes_count: 0
                };
                
                console.log('⚠️ Using compatibility mode - storing deck info locally');
                localStorage.setItem('default_deck', JSON.stringify(defaultDeck));
                return defaultDeck;
            }
            
            const { data, error } = await supabaseClient
                .from('note_sets')
                .insert([{
                    name: deckName,
                    language: language,
                    definition_lang: definitionLang,
                    user_id: user.id,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error creating deck:', error);
                return null;
            }
            
            console.log('✅ Created deck:', data);
            return data;
        } catch (err) {
            console.error('💥 Error in createDeck:', err);
            return null;
        }
    }
    
    // Update the fetchNotes function to filter by deck
    async function fetchNotesByDeck(deckId = null) {
        console.log('🔍 FETCH STARTED: Beginning data fetch process for deck:', deckId);
        
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
            
            // 3. Build query based on deck selection
            let query = supabaseClient
                .from('notes')
                .select('term, definition, term_lang, created_at, note_set_id')
                .eq('user_id', user.id);
            
            // Filter by deck if specified (but handle compatibility mode)
            if (deckId && deckId !== 'default') {
                query = query.eq('note_set_id', deckId);
            } else if (deckId === 'default') {
                // In compatibility mode, get notes without note_set_id
                query = query.is('note_set_id', null);
            }
            
            // Create a timeout promise to handle stalled queries
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timed out after 10 seconds')), 10000)
            );
            
            // Race the query against the timeout
            const { data, error } = await Promise.race([
                query,
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
                // Validate each note has required fields - only term is required, definition can be empty
                if (!note.term) {
                    console.warn(`⚠️ Note at index ${index} is missing required term:`, note);
                    return null;
                }
                
                return {
                    lang1: note.term,
                    lang2: note.definition || '', // Handle empty definitions
                    term_lang: note.term_lang || 'en-GB', // Include language info
                    created_at: note.created_at, // Include timestamp for filtering
                    note_set_id: note.note_set_id, // Include deck info
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
            console.error('💥 Unexpected error in fetchNotesByDeck:', err);
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
    
    // Render the decks in the side panel
    function renderDecks(decks) {
        console.log('🎨 Rendering decks:', decks);
        
        const decksList = document.getElementById('decksList');
        if (!decksList) return;
        
        decksList.innerHTML = '';
        
        if (decks.length === 0) {
            decksList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <p class="text-sm">No decks yet.</p>
                    <p class="text-xs">Create your first deck above!</p>
                </div>
            `;
            return;
        }
        
        // Group decks by language
        const decksByLanguage = {};
        decks.forEach(deck => {
            const languageDisplay = getLanguageDisplayName(deck.language);
            if (!decksByLanguage[languageDisplay]) {
                decksByLanguage[languageDisplay] = [];
            }
            decksByLanguage[languageDisplay].push(deck);
        });
        
        // Render each language group
        Object.entries(decksByLanguage).forEach(([language, languageDecks]) => {
            const languageGroup = document.createElement('div');
            languageGroup.className = 'deck-language-group';
            
            languageGroup.innerHTML = `
                <div class="deck-language-header">${language}</div>
                ${languageDecks.map(deck => `
                    <div class="deck-item ${deck.id === currentlySelectedDeckId ? 'active' : ''}" 
                         data-deck-id="${deck.id}" 
                         data-deck-name="${deck.name}"
                         data-deck-language="${deck.language}">
                        <svg class="deck-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                        <span class="deck-item-text">${deck.name}</span>
                        <span class="deck-item-count">${deck.notes_count || 0}</span>
                    </div>
                `).join('')}
            `;
            
            decksList.appendChild(languageGroup);
        });
        
        // Add click listeners to deck items
        decksList.querySelectorAll('.deck-item').forEach(item => {
            item.addEventListener('click', async () => {
                const deckId = item.getAttribute('data-deck-id');
                const deckName = item.getAttribute('data-deck-name');
                const deckLanguage = item.getAttribute('data-deck-language');
                
                await selectDeck(deckId, deckName, deckLanguage);
            });
        });
    }
    
    // Select a deck and update the UI
    async function selectDeck(deckId, deckName, deckLanguage) {
        console.log('🎯 Selecting deck:', deckId, deckName, deckLanguage);
        
        // Get the full deck object to access all properties
        const selectedDeck = userDecks.find(deck => deck.id === deckId);
        
        // Update state
        currentlySelectedDeckId = deckId;
        currentDeck = selectedDeck; // Set the global currentDeck variable
        csvUploadedTargetLanguage = deckLanguage;
        activeTargetStudyLanguage = deckLanguage;
        
        console.log('🎯 Global currentDeck set to:', currentDeck);
        
        // Store selected deck for session persistence
        localStorage.setItem('lastSelectedDeckId', deckId);
        localStorage.setItem('lastSelectedDeckName', deckName);
        localStorage.setItem('lastSelectedDeckLanguage', deckLanguage);
        
        // Store language preferences for translation function compatibility
        if (selectedDeck) {
            localStorage.setItem('user_learning_language', deckLanguage);
            if (selectedDeck.definition_lang) {
                localStorage.setItem('user_native_language', selectedDeck.definition_lang);
            }
        }
        
        // Update active deck visuals
        document.querySelectorAll('.deck-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-deck-id="${deckId}"]`)?.classList.add('active');
        
        // Fetch notes for this deck
        await fetchNotesByDeck(deckId);
        
        // Check if we should auto-trigger games (6+ words)
        if (vocabulary && vocabulary.length >= 6) {
            console.log('🎮 Auto-triggering games: Found', vocabulary.length, 'words');
            // Show game selection automatically
            setTimeout(() => {
                if (typeof showGameSelection === 'function') {
                    showGameSelection();
                }
            }, 500); // Small delay to ensure UI is ready
        }
        
        // Close panel on mobile
        if (window.innerWidth <= 768) {
            toggleDeckPanel();
        }
        
        console.log('✅ Deck selected and notes loaded');
    }
    
    // Get display name for language code
    function getLanguageDisplayName(languageCode) {
        const languageMap = {
            'en-GB': 'English',
            'en-US': 'English',
            'es-ES': 'Spanish',
            'fr-FR': 'French',
            'de-DE': 'German',
            'it-IT': 'Italian',
            'pt-PT': 'Portuguese',
            'ja-JP': 'Japanese',
            'ko-KR': 'Korean',
            'zh-CN': 'Chinese',
            'nl-NL': 'Dutch',
            'ru-RU': 'Russian',
            'ar-SA': 'Arabic'
        };
        return languageMap[languageCode] || languageCode;
    }
    
    // Toggle the side panel
    function toggleDeckPanel() {
        const panel = document.getElementById('deckSidePanel');
        const toggle = document.getElementById('deckSidePanelToggle');
        const mainContent = document.getElementById('mainContent');
        
        isPanelOpen = !isPanelOpen;
        
        if (isPanelOpen) {
            panel.classList.add('open');
            toggle.classList.add('open');
            if (window.innerWidth > 768) {
                mainContent.classList.add('panel-open');
            }
        } else {
            panel.classList.remove('open');
            toggle.classList.remove('open');
            mainContent.classList.remove('panel-open');
        }
    }
    
    // Initialize deck management
    async function initializeDeckManagement() {
        console.log('🏗️ Initializing deck management...');
        
        try {
            // First check if we have a default deck from compatibility mode
            const defaultDeckData = localStorage.getItem('default_deck');
            if (defaultDeckData) {
                const defaultDeck = JSON.parse(defaultDeckData);
                console.log('🔄 Found default deck in compatibility mode:', defaultDeck);
                userDecks = [defaultDeck];
                renderDecks(userDecks);
                await selectDeck(defaultDeck.id, defaultDeck.name, defaultDeck.language);
                return;
            }
            
            // Fetch user's decks
            userDecks = await fetchUserDecks();
            console.log('📚 User decks:', userDecks);
            
            if (userDecks.length === 0) {
                // New user - show welcome modal
                console.log('👋 New user detected - showing welcome modal');
                showWelcomeModal();
            } else {
                // Existing user - render decks and auto-select appropriate deck
                console.log('👤 Existing user - rendering decks');
                renderDecks(userDecks);
                
                // Try to restore last selected deck, otherwise select first one
                const lastSelectedDeckId = localStorage.getItem('lastSelectedDeckId');
                let deckToSelect = userDecks[0]; // Default to first deck
                
                if (lastSelectedDeckId) {
                    const lastDeck = userDecks.find(deck => deck.id === lastSelectedDeckId);
                    if (lastDeck) {
                        deckToSelect = lastDeck;
                        console.log('🔄 Restoring last selected deck:', lastDeck.name);
                    } else {
                        console.log('⚠️ Last selected deck not found, using first deck');
                    }
                }
                
                await selectDeck(deckToSelect.id, deckToSelect.name, deckToSelect.language);
            }
        } catch (err) {
            console.error('💥 Error initializing deck management:', err);
            // Fallback to show welcome modal on error
            showWelcomeModal();
        }
    }
    
    // Show welcome modal for new users
    function showWelcomeModal() {
        const modal = document.getElementById('welcomeDeckModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    // Hide welcome modal
    function hideWelcomeModal() {
        const modal = document.getElementById('welcomeDeckModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // --- STATE & CONSTANTS ---
    const MAX_MISTAKES = 3, FAST_ANSWER_THRESHOLD = 5e3, POINTS_CORRECT_TALK_TO_ME = 5, POINTS_FAST_CORRECT = 10, POINTS_SLOW_CORRECT = 5, POINTS_INCORRECT = -10, ITEMS_PER_PART = 32, ITEMS_PER_SUB_ROUND = 8, MAX_GAME_ITEMS_FILL_BLANKS = 10, TEXT_TRUNCATE_LENGTH = 60, MAX_FIND_WORDS_ROUNDS = 5, WORDS_PER_FIND_WORDS_DISPLAY = 8, WORDS_PER_FIND_WORDS_TARGET = 3, FIND_WORDS_REQUIRED_VOCAB = 15;
    let vocabulary = [], csvUploadedTargetLanguage = "en-GB", activeTargetStudyLanguage = "en-GB", recognition, isListening = false, isSignUp = false, isAuthenticating = false;
    
    // --- DECK MANAGEMENT STATE ---
    let currentlySelectedDeckId = null;
    let userDecks = [];
    let currentDeck = null;
    let isPanelOpen = false;
    
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
    const liveNotesModal = document.getElementById('liveNotesModal'), liveNotesContainer = document.getElementById('liveNotesContainer'), closeLiveNotesBtn = document.getElementById('closeLiveNotesBtn'), liveNotesTextarea = document.getElementById('liveNotesTextarea'), liveNotesLanguageSelector = document.getElementById('liveNotesLanguageSelector'), newLineBtn = document.getElementById('newLineBtn'), previousLineBtn = document.getElementById('previousLineBtn'), clearAllBtn = document.getElementById('clearAllBtn'), translateTextBtn = document.getElementById('translateTextBtn'), manualSaveBtn = document.getElementById('manualSaveBtn'), saveStatus = document.getElementById('saveStatus'), lineCount = document.getElementById('lineCount'), parsedCount = document.getElementById('parsedCount'), cloudIcon = document.getElementById('cloudIcon'), uploadArrow = document.getElementById('uploadArrow');
    const mainSelectionSection = document.getElementById("mainSelectionSection"), showUploadSectionBtn = document.getElementById("showUploadSectionBtn"), showEssentialsSectionBtn = document.getElementById("showEssentialsSectionBtn"), csvFileInput = document.getElementById("csvFile"), targetLanguageSelector = document.getElementById("targetLanguageSelector"), languageSelectorInGame = document.getElementById("languageSelectorInGame"), languageSelectionInGameContainer = document.getElementById("languageSelectionInGameContainer"), uploadBtn = document.getElementById("uploadBtn"), uploadStatus = document.getElementById("uploadStatus"), uploadSection = document.getElementById("uploadSection"), dropZone = document.getElementById("dropZone"), backToMainSelectionFromUploadBtn = document.getElementById("backToMainSelectionFromUploadBtn"), essentialsCategorySelectionSection = document.getElementById("essentialsCategorySelectionSection"), essentialsCategoryButtonsContainer = document.getElementById("essentialsCategoryButtonsContainer"), backToMainSelectionFromEssentialsBtn = document.getElementById("backToMainSelectionFromEssentialsBtn"), essentialsCategoryOptionsSection = document.getElementById("essentialsCategoryOptionsSection"), essentialsOptionsTitle = document.getElementById("essentialsOptionsTitle"), reviewEssentialsCategoryBtn = document.getElementById("reviewEssentialsCategoryBtn"), playGamesWithEssentialsBtn = document.getElementById("playGamesWithEssentialsBtn"), backToEssentialsCategoriesBtn = document.getElementById("backToEssentialsCategoriesBtn"), gameSelectionSection = document.getElementById("gameSelectionSection"), gameButtonsContainer = document.getElementById("gameButtonsContainer"), backToSourceSelectionBtn = document.getElementById("backToSourceSelectionBtn"), gameArea = document.getElementById("gameArea"), noVocabularyMessage = document.getElementById("noVocabularyMessage"), gameOverMessage = document.getElementById("gameOverMessage"), roundCompleteMessageDiv = document.getElementById("roundCompleteMessage"), bonusRoundCountdownMessageDiv = document.getElementById("bonusRoundCountdownMessage"), matchingBtn = document.getElementById("matchingBtn"), multipleChoiceBtn = document.getElementById("multipleChoiceBtn"), memoryTestBtn = document.getElementById("memoryTestBtn"), typeTranslationBtn = document.getElementById("typeTranslationBtn"), talkToMeBtn = document.getElementById("talkToMeBtn"), fillInTheBlanksBtn = document.getElementById("fillInTheBlanksBtn"), findTheWordsBtn = document.getElementById("findTheWordsBtn"), backToGameSelectionBtn = document.getElementById("backToGameSelectionBtn"), gameTitle = document.getElementById("gameTitle"), musicToggleBtn = document.getElementById("musicToggleBtn"), musicIconOn = document.getElementById("musicIconOn"), musicIconOff = document.getElementById("musicIconOff"), musicStatusText = document.getElementById("musicStatusText"), mistakeTrackerDiv = document.getElementById("mistakeTracker"), currentScoreDisplay = document.getElementById("currentScoreDisplay"), maxScoreDisplay = document.getElementById("maxScoreDisplay"), partSelectionContainer = document.getElementById("partSelectionContainer"), partButtonsContainer = document.getElementById("partButtonsContainer");
    const matchingGameContainer = document.getElementById("matchingGame"), matchingGrid = document.getElementById("matchingGrid"), matchingInstructions = document.getElementById("matchingInstructions"), matchingFeedback = document.getElementById("matchingFeedback"), resetCurrentPartBtn = document.getElementById("resetCurrentPartBtn"), memoryTestGameContainer = document.getElementById("memoryTestGame"), memoryTestGrid = document.getElementById("memoryTestGrid"), memoryTestInstructions = document.getElementById("memoryTestInstructions"), memoryTestFeedback = document.getElementById("memoryTestFeedback"), memoryTestLives = document.getElementById("memoryTestLives"), memoryTestTimer = document.getElementById("memoryTestTimer"), memoryTestTimerValue = document.getElementById("memoryTestTimerValue"), memoryTestRoundInfo = document.getElementById("memoryTestRoundInfo"), memoryTestRecording = document.getElementById("memoryTestRecording"), memoryTestRecognizedText = document.getElementById("memoryTestRecognizedText"), memoryTestHintBtn = document.getElementById("memoryTestHintBtn"), memoryTestHint = document.getElementById("memoryTestHint"), resetMemoryTestBtn = document.getElementById("resetMemoryTestBtn"), multipleChoiceGameContainer = document.getElementById("multipleChoiceGame"), mcqInstructions = document.getElementById("mcqInstructions"), mcqQuestion = document.getElementById("mcqQuestion"), mcqOptions = document.getElementById("mcqOptions"), mcqFeedback = document.getElementById("mcqFeedback"), nextMcqBtn = document.getElementById("nextMcqBtn");
    const typeTranslationGameContainer = document.getElementById("typeTranslationGame"), typeTranslationInstructions = document.getElementById("typeTranslationInstructions"), typeTranslationPhrase = document.getElementById("typeTranslationPhrase"), typeTranslationInput = document.getElementById("typeTranslationInput"), hintTypeTranslationBtn = document.getElementById("hintTypeTranslationBtn"), typeTranslationHintDisplay = document.getElementById("typeTranslationHintDisplay"), checkTypeTranslationBtn = document.getElementById("checkTypeTranslationBtn"), typeTranslationFeedback = document.getElementById("typeTranslationFeedback"), nextTypeTranslationBtn = document.getElementById("nextTypeTranslationBtn"), typeTranslationCounter = document.getElementById("typeTranslationCounter");
    const fillInTheBlanksGameContainer = document.getElementById("fillInTheBlanksGame"), fillInTheBlanksInstructions = document.getElementById("fillInTheBlanksInstructions"), fillInTheBlanksSentence = document.getElementById("fillInTheBlanksSentence"), fillInTheBlanksInput = document.getElementById("fillInTheBlanksInput"), checkFillInTheBlanksBtn = document.getElementById("checkFillInTheBlanksBtn"), fillInTheBlanksFeedback = document.getElementById("fillInTheBlanksFeedback"), nextFillInTheBlanksBtn = document.getElementById("nextFillInTheBlanksBtn"), fillInTheBlanksCounter = document.getElementById("fillInTheBlanksCounter");
    const findTheWordsGameContainer = document.getElementById("findTheWordsGame"), findTheWordsInstructions = document.getElementById("findTheWordsInstructions"), replayFindTheWordsAudioBtn = document.getElementById("replayFindTheWordsAudioBtn"), findTheWordsRoundCounter = document.getElementById("findTheWordsRoundCounter"), findTheWordsGrid = document.getElementById("findTheWordsGrid"), sendFindTheWordsBtn = document.getElementById("sendFindTheWordsBtn"), findTheWordsFeedback = document.getElementById("findTheWordsFeedback"), nextFindTheWordsRoundBtn = document.getElementById("nextFindTheWordsRoundBtn"), talkToMeGameContainer = document.getElementById("talkToMeGame"), talkToMeInstructions = document.getElementById("talkToMeInstructions"), talkToMePhraseToRead = document.getElementById("talkToMePhraseToRead"), talkToMePhraseText = document.getElementById("talkToMePhraseText"), speakPhraseBtn = document.getElementById("speakPhraseBtn"), listenBtn = document.getElementById("listenBtn"), listenBtnText = document.getElementById("listenBtnText"), nextTalkToMeBtn = document.getElementById("nextTalkToMeBtn"), talkToMeRecognizedText = document.getElementById("talkToMeRecognizedText"), talkToMeFeedback = document.getElementById("talkToMeFeedback"), talkToMeReferenceContainer = document.getElementById("talkToMeReferenceContainer"), talkToMeReferenceLabel = document.getElementById("talkToMeReferenceLabel"), talkToMeReferenceDisplay = document.getElementById("talkToMeReferenceDisplay"), talkToMeCounter = document.getElementById("talkToMeCounter"), speechApiStatus = document.getElementById("speechApiStatus"), hearItOutLoudToggleBtn = document.getElementById("hearItOutLoudToggleBtn"), hearItOutLoudBtnText = document.getElementById("hearItOutLoudBtnText"), ttsGeneralStatus = document.getElementById("ttsGeneralStatus");

    // --- DATA ---
    
    // Helper functions for contenteditable Live Notes
    function getNotesContent() {
        return liveNotesTextarea.textContent || '';
    }
    
    function setNotesContent(content) {
        // For the new star-based system, just set content directly as plain text
        // Convert to HTML format for contenteditable while preserving line breaks
        const htmlContent = content
            .split('\n')
            .map(line => line.trim())
            .join('<br>');
        
        liveNotesTextarea.innerHTML = htmlContent;
        // Trigger placeholder visibility update
        updatePlaceholderVisibility();
    }
    
    function setCursorPosition(element, position) {
        // Set cursor position in contenteditable element
        const selection = window.getSelection();
        const range = document.createRange();
        
        let currentPos = 0;
        let targetNode = null;
        let targetOffset = 0;
        
        // Walk through text nodes to find the target position
        function walkTextNodes(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent.length;
                if (currentPos + textLength >= position) {
                    targetNode = node;
                    targetOffset = position - currentPos;
                    return true;
                }
                currentPos += textLength;
            } else {
                for (let child of node.childNodes) {
                    if (walkTextNodes(child)) return true;
                }
            }
            return false;
        }
        
        if (walkTextNodes(element) && targetNode) {
            range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent.length));
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Fallback: position at end
            range.selectNodeContents(element);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    function updatePlaceholderVisibility() {
        const hasContent = liveNotesTextarea.textContent && liveNotesTextarea.textContent.trim().length > 0;
        if (hasContent) {
            liveNotesTextarea.removeAttribute('data-show-placeholder');
        } else {
            liveNotesTextarea.setAttribute('data-show-placeholder', 'true');
        }
    }
    
    function getNotesTextContent() {
        // Get plain text content while preserving line breaks from HTML
        // This properly handles contenteditable with <br> tags and HTML formatting
        let content = liveNotesTextarea.innerHTML || '';
        
        // Convert HTML to plain text while preserving line structure
        content = content
            .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to newlines
            .replace(/<\/div>/gi, '\n')     // Convert closing div tags to newlines
            .replace(/<div[^>]*>/gi, '\n')  // Convert opening div tags to newlines  
            .replace(/<[^>]*>/g, '')        // Strip all other HTML tags
            .replace(/&nbsp;/g, ' ')        // Convert &nbsp; to regular spaces
            .replace(/&amp;/g, '&')         // Convert &amp; to &
            .replace(/&lt;/g, '<')          // Convert &lt; to <
            .replace(/&gt;/g, '>')          // Convert &gt; to >
            .replace(/\n\s*\n/g, '\n')      // Remove empty lines created by HTML structure
            .trim();                        // Remove leading/trailing whitespace
        
        console.log('📝 getNotesTextContent: Raw HTML:', liveNotesTextarea.innerHTML);
        console.log('📝 getNotesTextContent: Converted text:', content);
        console.log('📝 getNotesTextContent: Split lines:', content.split('\n'));
        
        return content;
    }
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
                definition_lang: 'en',
                note_set_id: currentlySelectedDeckId === 'default' ? null : currentlySelectedDeckId // Handle compatibility mode
            }));
            console.log('📊 saveNotes: Preparing to insert into Supabase:', notesWithUser.length, 'notes');
            console.log('📊 saveNotes: Sample note data:', notesWithUser.slice(0, 1));
            
            // Check for duplicates before inserting
            console.log('🔍 saveNotes: Checking for duplicate terms...');
            const duplicates = [];
            const newNotes = [];
            
            for (const note of notesWithUser) {
                // Check if this term already exists for this user and deck
                const { data: existingNotes, error: checkError } = await supabaseClient
                    .from('notes')
                    .select('term, definition')
                    .eq('user_id', userResult.data.user.id)
                    .eq('term', note.term)
                    .eq('note_set_id', note.note_set_id);
                
                if (checkError) {
                    console.error('❌ Error checking for duplicates:', checkError);
                    // Continue with insert on error
                    newNotes.push(note);
                } else if (existingNotes && existingNotes.length > 0) {
                    // Found duplicate
                    duplicates.push({
                        term: note.term,
                        existingDefinition: existingNotes[0].definition,
                        newDefinition: note.definition
                    });
                } else {
                    // No duplicate found
                    newNotes.push(note);
                }
            }
            
            // Handle duplicates if found
            if (duplicates.length > 0) {
                console.log('⚠️ Found', duplicates.length, 'duplicate terms');
                
                const handleDuplicates = await showDuplicateConfirmationModal(duplicates);
                
                if (handleDuplicates.action === 'cancel') {
                    console.log('🚫 User cancelled upload due to duplicates');
                    if (uploadStatus) {
                        uploadStatus.textContent = 'Upload cancelled due to duplicates.';
                        uploadStatus.className = 'text-sm text-gray-600 mt-2 h-5';
                    }
                    return false;
                } else if (handleDuplicates.action === 'replace') {
                    // Update existing notes instead of inserting new ones
                    console.log('🔄 Replacing', handleDuplicates.selectedTerms.length, 'duplicate terms');
                    
                    for (const term of handleDuplicates.selectedTerms) {
                        const noteToUpdate = notesWithUser.find(n => n.term === term);
                        if (noteToUpdate) {
                            const { error: updateError } = await supabaseClient
                                .from('notes')
                                .update({
                                    definition: noteToUpdate.definition,
                                    definition_lang: noteToUpdate.definition_lang
                                })
                                .eq('user_id', userResult.data.user.id)
                                .eq('term', term)
                                .eq('note_set_id', noteToUpdate.note_set_id);
                            
                            if (updateError) {
                                console.error('❌ Error updating duplicate term:', term, updateError);
                            } else {
                                console.log('✅ Updated duplicate term:', term);
                            }
                        }
                    }
                    
                    // Remove duplicates from newNotes if user chose to replace some
                    const finalNewNotes = newNotes.filter(note => 
                        !handleDuplicates.selectedTerms.includes(note.term)
                    );
                    
                    if (finalNewNotes.length > 0) {
                        console.log('💾 saveNotes: Executing INSERT query for', finalNewNotes.length, 'new notes...');
                        const { data, error } = await supabaseClient.from('notes').insert(finalNewNotes);
                        
                        if (error) {
                            console.error('❌ saveNotes: Error saving new notes:', error);
                            return false;
                        }
                    }
                    
                    const totalProcessed = handleDuplicates.selectedTerms.length + (finalNewNotes?.length || 0);
                    console.log('✅ saveNotes: Successfully processed', totalProcessed, 'notes (updates + new)');
                    return true;
                }
            }

            console.log('💾 saveNotes: Executing INSERT query for', newNotes.length, 'unique notes...');
            const insertStartTime = Date.now();
            const { data, error } = await supabaseClient.from('notes').insert(newNotes);
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
            
            // Refresh the current deck's notes count
            if (currentlySelectedDeckId) {
                userDecks = await fetchUserDecks();
                renderDecks(userDecks);
            }
            
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
    let connectionCheckInterval = null;
    
    async function initializeLiveNotes() {
        // Show modal first
        liveNotesModal.classList.remove('hidden');
        
        // Restore database connection immediately
        await restoreLiveNotesConnection();
        
        // Start periodic connection checking to maintain connection during use
        startConnectionMonitoring();
        
        // Initialize Live Notes language selector AFTER showing modal
        await initializeLiveNotesLanguage();
        
        // Initialize auto-translate functionality
        await initializeAutoTranslate();
        
        // Try to restore previous Live Notes content from localStorage
        const savedContent = localStorage.getItem('live_notes_content');
        if (savedContent) {
            setNotesContent(savedContent);
            notepadContent = savedContent;
            parseNotepadContent();
            console.log('📝 Restored Live Notes content from localStorage');
        } else {
            // Clear existing content if no saved content
            notepadContent = '';
            liveNotesData = [];
            setNotesContent('');
        }
        
        pendingChanges = false;
        
        // Initialize placeholder visibility
        updatePlaceholderVisibility();
        
        // Add event listeners to notepad
        liveNotesTextarea.addEventListener('input', handleNotepadInput);
        liveNotesTextarea.addEventListener('keydown', handleNotepadKeydown);
        liveNotesTextarea.addEventListener('click', handleNotepadClick);
        
        // Add touch event handling for better mobile/stylus experience
        liveNotesTextarea.addEventListener('touchstart', handleNotepadTouchStart, { passive: false });
        liveNotesTextarea.addEventListener('touchend', handleNotepadTouchEnd, { passive: false });
        
        // Add page visibility listeners to handle device lock/unlock
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('blur', handleWindowBlur);
        
        // Initialize display counters and status
        updateLineAndParsedCounts();
        updateSaveStatus();
        
        // Start auto-save timer
        startAutoSaveTimer();
        
        // Focus on textarea
        liveNotesTextarea.focus();
    }
    
    function handleNotepadClick(event) {
        console.log('🗣️ handleNotepadClick: Click detected');
        
        // Ensure voices are loaded for speaking
        ensureVoicesLoaded();
        
        // Get current selection and position
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            console.log('🗣️ No selection range found');
            return;
        }
        
        const range = selection.getRangeAt(0);
        
        // Get the text content to work with
        const fullText = getNotesTextContent();
        console.log('🗣️ Full text content:', fullText);
        
        // Split into lines
        const lines = fullText.split('\n');
        console.log('🗣️ Lines found:', lines.length, lines);
        
        // Try to determine which line was clicked by getting text before cursor
        let textBeforeCursor = '';
        let linesBefore = 0;
        
        try {
            // Create a range from start of content to cursor position
            const fullRange = document.createRange();
            fullRange.selectNodeContents(liveNotesTextarea);
            fullRange.setEnd(range.startContainer, range.startOffset);
            textBeforeCursor = fullRange.toString();
            linesBefore = textBeforeCursor.split('\n').length - 1;
            console.log('🗣️ Text before cursor:', textBeforeCursor);
            console.log('🗣️ Lines before cursor:', linesBefore);
        } catch (e) {
            console.log('🗣️ Could not determine cursor position, trying alternative method');
            
            // Alternative method: use the clicked position more directly
            const clickedNode = event.target;
            if (clickedNode.nodeType === Node.TEXT_NODE) {
                // Get the text content of the parent element
                const parentText = clickedNode.parentElement.textContent || clickedNode.textContent;
                console.log('🗣️ Parent text content:', parentText);
                
                // Find this text in our lines
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(parentText.trim()) || parentText.includes(lines[i].trim())) {
                        console.log('🗣️ Found matching line at index:', i);
                        linesBefore = i;
                        break;
                    }
                }
            }
        }
        
        // Fallback: If we still can't determine the line, look for any line with content
        if (linesBefore >= lines.length || linesBefore < 0) {
            console.log('🗣️ Line index out of bounds, using fallback method');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes(' - ') && line.trim() !== '') {
                    const dashIndex = line.indexOf(' - ');
                    const termPart = line.substring(0, dashIndex).trim();
                    if (termPart) {
                        console.log('🗣️ Speaking term (fallback):', termPart);
                        speakText(termPart, activeTargetStudyLanguage || 'en-GB');
                        return;
                    }
                }
            }
            console.log('🗣️ No suitable line found for fallback speaking');
            return;
        }
        
        // Get the current line
        const currentLine = lines[linesBefore];
        console.log('🗣️ Current line:', currentLine);
        
        if (!currentLine || currentLine.trim() === '') {
            console.log('🗣️ Current line is empty');
            return;
        }
        
        // Check if this line has a dash separator
        const dashIndex = currentLine.indexOf(' - ');
        if (dashIndex > 0) {
            // Check if line has a star (indicating auto-translation)
            const hasAutoTranslation = currentLine.includes(' ⭐');
            
            // Get position within the current line
            const linesBeforeText = textBeforeCursor.split('\n').slice(0, -1).join('\n');
            const positionInLine = textBeforeCursor.length - linesBeforeText.length - (linesBefore > 0 ? 1 : 0);
            
            console.log('🗣️ Position in line:', positionInLine, 'Dash at:', dashIndex);
            
            // If clicking on the part after the dash and it has a star, don't speak
            if (hasAutoTranslation && positionInLine > dashIndex) {
                console.log('🗣️ Clicked on auto-translated text (⭐) - not speaking');
                return;
            }
            
            // Otherwise, speak the term part (before the dash)
            const termPart = currentLine.substring(0, dashIndex).trim();
            if (termPart) {
                console.log('🗣️ Speaking term:', termPart);
                const languageToUse = activeTargetStudyLanguage || currentDeck?.term_lang || 'en-GB';
                console.log('🗣️ Using language:', languageToUse);
                speakText(termPart, languageToUse);
            } else {
                console.log('🗣️ No term part found to speak');
            }
        } else {
            // Line doesn't have a dash, might be a single word - speak it anyway
            const singleWord = currentLine.trim();
            if (singleWord && !singleWord.includes('⭐')) {
                console.log('🗣️ Speaking single word/phrase:', singleWord);
                const languageToUse = activeTargetStudyLanguage || currentDeck?.term_lang || 'en-GB';
                speakText(singleWord, languageToUse);
            } else {
                console.log('🗣️ No dash found in current line and no single word to speak');
            }
        }
    }
    
    // Touch event handlers for better mobile/stylus experience
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    
    function handleNotepadTouchStart(event) {
        console.log('📱 Touch start detected in Live Notes');
        touchStartTime = Date.now();
        if (event.touches && event.touches.length > 0) {
            touchStartPos.x = event.touches[0].clientX;
            touchStartPos.y = event.touches[0].clientY;
        }
        
        // For stylus/Apple Pencil, ensure we don't interfere with normal text input
        // We only want to handle positioning, not prevent writing
    }
    
    function handleNotepadTouchEnd(event) {
        console.log('📱 Touch end detected in Live Notes');
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        
        // If it's a quick tap (not a drag or long press), handle cursor positioning
        if (touchDuration < 300 && event.changedTouches && event.changedTouches.length > 0) {
            const touchEndPos = {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY
            };
            
            const moveDistance = Math.sqrt(
                Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
                Math.pow(touchEndPos.y - touchStartPos.y, 2)
            );
            
            // If it's a tap (not a drag)
            if (moveDistance < 10) {
                console.log('📱 Quick tap detected - checking if this is a new line tap');
                
                // Use a small delay to let the browser handle the default behavior first
                setTimeout(() => {
                    // Check if we should position cursor at start of a new line
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const textBeforeCursor = getTextBeforeCursor(range);
                        const lines = textBeforeCursor.split('\n');
                        const currentLineIndex = lines.length - 1;
                        const currentLineText = lines[currentLineIndex] || '';
                        
                        // If the user tapped at the end of a line area, ensure cursor is positioned correctly
                        console.log('📱 Touch positioning - current line text:', currentLineText);
                        
                        // Prevent accidentally taking characters from previous line when creating new line
                        if (currentLineText.trim() === '' && lines.length > 1) {
                            // We're on an empty line - this is good, no adjustment needed
                            console.log('📱 Touch on empty line - cursor positioning looks correct');
                        }
                    }
                }, 50);
            }
        }
    }
    
    function getTextBeforeCursor(range) {
        try {
            const fullRange = document.createRange();
            fullRange.selectNodeContents(liveNotesTextarea);
            fullRange.setEnd(range.startContainer, range.startOffset);
            return fullRange.toString();
        } catch (e) {
            console.log('📱 Could not get text before cursor:', e);
            return '';
        }
    }
    
    async function initializeLiveNotesLanguage() {
        const liveNotesLanguageSelector = document.getElementById('liveNotesLanguageSelector');
        
        // Ensure currentDeck is set if we have a selected deck ID but currentDeck is null
        if (!currentDeck && currentlySelectedDeckId && userDecks.length > 0) {
            currentDeck = userDecks.find(deck => deck.id === currentlySelectedDeckId);
            console.log('🔧 initializeLiveNotesLanguage: Restored currentDeck from userDecks:', currentDeck);
        }
        
        // Use deck's language settings instead of modal
        if (currentDeck && currentDeck.term_lang) {
            liveNotesLanguageSelector.value = currentDeck.term_lang;
            console.log('🌐 Using deck learning language for Live Notes:', currentDeck.term_lang);
        } else {
            // Fall back to stored language if no deck is selected
            const storedLanguage = localStorage.getItem('learning_language');
            if (storedLanguage) {
                liveNotesLanguageSelector.value = storedLanguage;
                console.log('🌐 Using stored learning language for Live Notes (fallback):', storedLanguage);
            } else {
                // Final fallback to English
                liveNotesLanguageSelector.value = 'en-GB';
                console.log('🌐 Using default language for Live Notes (final fallback): en-GB');
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
        // Check for unsaved changes and ask for confirmation
        const content = getNotesTextContent();
        const hasUnsavedContent = content && content.trim() !== '';
        
        if (hasUnsavedContent && pendingChanges) {
            const userWantsToSave = confirm(
                "You have unsaved changes in Live Notes.\n\n" +
                "Click 'OK' to save your changes before closing.\n" +
                "Click 'Cancel' to close without saving (changes will be lost)."
            );
            
            if (userWantsToSave) {
                // Save before closing
                console.log('🚪 User chose to save before closing');
                saveLiveNotes(true); // Force immediate save
                // Continue with closing process after a brief delay to allow save to complete
                setTimeout(() => {
                    finalizeLiveNotesClosing();
                }, 1000);
                return;
            } else {
                // User chose to discard changes
                console.log('🚪 User chose to discard changes and close');
                // Clear any saved content in localStorage
                localStorage.removeItem('live_notes_content');
                pendingChanges = false;
            }
        }
        
        // Proceed with immediate closing
        finalizeLiveNotesClosing();
    }
    
    function finalizeLiveNotesClosing() {
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
        
        // Stop connection monitoring when closing Live Notes
        stopConnectionMonitoring();
        
        // Clear auto-save timeout
        if (window.autoSaveTimeout) {
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = null;
        }
        
        // Clear word pair auto-save timeout
        if (window.wordPairAutoSaveTimeout) {
            clearTimeout(window.wordPairAutoSaveTimeout);
            window.wordPairAutoSaveTimeout = null;
        }
        if (window.wordPairCountdownInterval) {
            clearInterval(window.wordPairCountdownInterval);
            window.wordPairCountdownInterval = null;
        }
        
        // Hide any translation suggestion
        hideTranslationSuggestion();
        
        // Remove visibility event listeners
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('blur', handleWindowBlur);
        
        // Check if we should auto-trigger games after closing Live Notes
        setTimeout(() => {
            if (vocabulary && vocabulary.length >= 6) {
                console.log('🎮 Auto-triggering games after Live Notes: Found', vocabulary.length, 'words');
                if (typeof showGameSelection === 'function') {
                    showGameSelection();
                }
            }
        }, 1000); // Delay to ensure save is complete
        
        // Hide modal
        liveNotesModal.classList.add('hidden');
    }
    
    function setupAutoSaveTimer() {
        // Clear existing timer
        if (window.autoSaveTimeout) {
            clearTimeout(window.autoSaveTimeout);
        }
        
        // Show "Changes pending" immediately when timer starts
        updateSaveStatus('Changes pending', 'text-orange-600');
        
        // Start countdown from 20 seconds
        let countdownSeconds = 20;
        
        // Show initial countdown in console
        console.log(`⏱️ Auto-save countdown started: ${countdownSeconds} seconds remaining`);
        
        // Real-time countdown display
        const countdownInterval = setInterval(() => {
            countdownSeconds--;
            console.log(`⏱️ Auto-save countdown: ${countdownSeconds} seconds remaining`);
            
            if (countdownSeconds > 0) {
                updateSaveStatus(`Auto-save in ${countdownSeconds}s...`, 'text-blue-600');
            }
            
            if (countdownSeconds <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Set new timer for actual save
        window.autoSaveTimeout = setTimeout(() => {
            clearInterval(countdownInterval);
            if (pendingChanges) {
                console.log('⏱️ Auto-save timer triggered - saving notes');
                updateSaveStatus('Saving...', 'text-orange-600');
                saveLiveNotes();
            }
        }, 20000); // Auto-save after 20 seconds of inactivity
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            // Page became hidden (device locked, tab switched, etc.)
            console.log('📱 Live Notes: Page became hidden, saving and pausing timers');
            
            // Save immediately before pausing
            if (pendingChanges) {
                saveLiveNotes(true); // Force immediate save
            }
            
            if (window.autoSaveTimeout) {
                clearTimeout(window.autoSaveTimeout);
            }
            if (autoAdvanceTimer) {
                clearTimeout(autoAdvanceTimer);
            }
        } else {
            // Page became visible again (device unlocked, tab focused, etc.)
            console.log('📱 Live Notes: Page became visible, restoring connection and resuming');
            
            // Test and restore database connection
            restoreLiveNotesConnection();
            
            // Save any pending changes immediately
            if (pendingChanges) {
                console.log('📱 Live Notes: Saving pending changes after visibility restore');
                saveLiveNotes(true);
            }
            
            // Restart auto-save timer
            if (liveNotesModal && !liveNotesModal.classList.contains('hidden')) {
                setupAutoSaveTimer();
            }
        }
    }
    
    function startConnectionMonitoring() {
        // Clear any existing interval
        if (connectionCheckInterval) {
            clearInterval(connectionCheckInterval);
        }
        
        // Check connection every 30 seconds while Live Notes is open
        connectionCheckInterval = setInterval(async () => {
            if (liveNotesModal && !liveNotesModal.classList.contains('hidden')) {
                console.log('🔍 Periodic connection check...');
                const isConnected = await testDatabaseConnection();
                if (!isConnected) {
                    console.log('⚠️ Connection lost during Live Notes session');
                    updateSaveStatus('Connection Lost - Click to Refresh', 'text-red-600 cursor-pointer', true);
                    showConnectionLostPrompt();
                } else {
                    console.log('✅ Connection check passed - checking for auto-save opportunities');
                    // Connection is good, check for new/updated content to auto-save
                    await checkAndAutoSaveChanges();
                }
            } else {
                // Stop monitoring if Live Notes is closed
                stopConnectionMonitoring();
            }
        }, 30000); // Check every 30 seconds
        
        console.log('🔍 Started connection monitoring for Live Notes');
    }
    
    // New function to automatically check and save changes during connection monitoring
    async function checkAndAutoSaveChanges() {
        try {
            const content = getNotesTextContent();
            if (!content || content.trim() === '') {
                console.log('💾 Auto-check: No content to check');
                return;
            }
            
            const parsedNotes = parseNotepadContentForSaving(content);
            console.log('💾 Auto-check: Found', parsedNotes.length, 'notes to process');
            
            // Check if there are any new or updated complete pairs (term - definition)
            const completePairs = parsedNotes.filter(note => 
                note.targetLang.trim() !== '' && 
                note.translation.trim() !== '' && 
                !note.translation.includes('⭐') // Don't auto-save auto-translated content
            );
            
            if (completePairs.length > 0) {
                console.log('💾 Auto-check: Found', completePairs.length, 'complete pairs ready for auto-save');
                
                // Check against existing vocabulary to see if these are truly new
                const existingTerms = new Set();
                if (vocabulary && Array.isArray(vocabulary)) {
                    vocabulary.forEach(item => {
                        if (item.lang1) existingTerms.add(item.lang1.toLowerCase().trim());
                    });
                }
                
                const newPairs = completePairs.filter(note => 
                    !existingTerms.has(note.targetLang.toLowerCase().trim())
                );
                
                if (newPairs.length > 0) {
                    console.log('💾 Auto-check: Auto-saving', newPairs.length, 'new complete pairs');
                    updateSaveStatus('Auto-saving new content...', 'text-blue-600');
                    
                    // Convert to the format expected by saveNotes
                    const notesToSave = newPairs.map(note => ({
                        lang1: note.targetLang,
                        lang2: note.translation
                    }));
                    
                    const success = await saveNotes(notesToSave);
                    if (success) {
                        console.log('✅ Auto-check: Successfully auto-saved', newPairs.length, 'notes');
                        updateSaveStatus('Auto-saved', 'text-green-600');
                        
                        // Refresh vocabulary to reflect the new additions
                        await fetchNotes();
                    } else {
                        console.log('❌ Auto-check: Failed to auto-save notes');
                        updateSaveStatus('Auto-save failed', 'text-red-600');
                    }
                } else {
                    console.log('💾 Auto-check: All complete pairs already exist in vocabulary');
                }
            } else {
                console.log('💾 Auto-check: No complete pairs found for auto-save');
            }
            
        } catch (error) {
            console.error('💥 Auto-check error:', error);
        }
    }
    
    function stopConnectionMonitoring() {
        if (connectionCheckInterval) {
            clearInterval(connectionCheckInterval);
            connectionCheckInterval = null;
            console.log('🔍 Stopped connection monitoring');
        }
    }
    
    async function restoreLiveNotesConnection() {
        console.log('🔌 Live Notes: Restoring database connection...');
        
        try {
            // Test database connection
            const connectionTest = await testDatabaseConnection();
            if (connectionTest) {
                console.log('✅ Live Notes: Database connection restored successfully');
                updateSaveStatus('Connected', 'text-green-600');
                hideConnectionLostPrompt(); // Hide prompt if shown
            } else {
                console.log('❌ Live Notes: Database connection failed, will show user prompt');
                updateSaveStatus('Connection Lost - Click to Refresh', 'text-red-600 cursor-pointer', true);
                showConnectionLostPrompt();
            }
        } catch (error) {
            console.error('💥 Live Notes: Error restoring connection:', error);
            updateSaveStatus('Connection Error - Click to Refresh', 'text-red-600 cursor-pointer', true);
            showConnectionLostPrompt();
        }
    }
    
    function updateSaveStatus(message = null, className = null, isClickable = false) {
        if (saveStatus) {
            // Set default message if none provided
            if (message === null) {
                if (pendingChanges) {
                    message = 'Changes pending';
                    className = 'text-orange-600';
                } else {
                    message = 'All saved';
                    className = 'text-green-600';
                }
            }
            
            saveStatus.textContent = message;
            saveStatus.className = `text-sm ${className}`;
            
            // Handle clickable connection lost message
            if (isClickable) {
                saveStatus.style.cursor = 'pointer';
                saveStatus.title = 'Click to refresh database connection';
                saveStatus.onclick = () => {
                    console.log('🔄 User clicked to refresh connection');
                    updateSaveStatus('Reconnecting...', 'text-orange-600');
                    restoreLiveNotesConnection();
                };
            } else {
                saveStatus.style.cursor = '';
                saveStatus.title = '';
                saveStatus.onclick = null;
            }
        }
        
        // Update cloud icon
        if (cloudIcon) {
            if (className && className.includes('green')) {
                cloudIcon.className = 'w-5 h-5 text-blue-500';
            } else if (className && className.includes('red')) {
                cloudIcon.className = 'w-5 h-5 text-red-500';
            } else {
                cloudIcon.className = 'w-5 h-5 text-orange-500';
            }
        }
    }
    
    function showConnectionLostPrompt() {
        // Create or show connection lost banner if not already shown
        let connectionBanner = document.getElementById('connectionLostBanner');
        if (!connectionBanner) {
            connectionBanner = document.createElement('div');
            connectionBanner.id = 'connectionLostBanner';
            connectionBanner.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
            connectionBanner.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <span class="font-medium">⚠️ Connection lost</span>
                        <span class="ml-2">Click here to refresh the connection to the database</span>
                    </div>
                    <button onclick="hideConnectionLostPrompt()" class="text-red-700 hover:text-red-900 ml-4">✕</button>
                </div>
            `;
            connectionBanner.style.cursor = 'pointer';
            connectionBanner.onclick = (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    console.log('🔄 User clicked connection banner to refresh');
                    hideConnectionLostPrompt();
                    updateSaveStatus('Reconnecting...', 'text-orange-600');
                    restoreLiveNotesConnection();
                }
            };
            
            // Insert at top of Live Notes modal content
            const liveNotesContent = document.querySelector('#liveNotesModal .card');
            if (liveNotesContent) {
                liveNotesContent.insertBefore(connectionBanner, liveNotesContent.firstChild);
            }
        }
        connectionBanner.style.display = 'block';
    }
    
    function hideConnectionLostPrompt() {
        const connectionBanner = document.getElementById('connectionLostBanner');
        if (connectionBanner) {
            connectionBanner.style.display = 'none';
        }
    }
    
    // Make functions globally accessible for onclick handlers
    window.hideConnectionLostPrompt = hideConnectionLostPrompt;
    
    // Update note progress for spaced repetition
    async function updateNoteProgress(term, definition, isCorrect) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                console.error('❌ No user authenticated for progress update');
                return false;
            }
            
            const now = new Date().toISOString();
            let ease_factor, interval_days;
            
            if (isCorrect) {
                // Correct answer: high ease factor, long interval (45 days)
                ease_factor = 5;
                interval_days = 45;
                console.log(`✅ Marking ${term} as mastered - ease_factor: ${ease_factor}, interval: ${interval_days} days`);
            } else {
                // Incorrect answer: low ease factor, short interval (1 day)  
                ease_factor = 1;
                interval_days = 1;
                console.log(`❌ Marking ${term} for review - ease_factor: ${ease_factor}, interval: ${interval_days} day`);
            }
            
            // Calculate next review date
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + interval_days);
            const nextReviewDate = nextReview.toISOString();
            
            // Try to update the existing note with progress data
            const { error } = await supabaseClient
                .from('notes')
                .update({
                    ease_factor: ease_factor,
                    interval_days: interval_days,
                    next_review: nextReviewDate,
                    last_reviewed: now
                })
                .eq('user_id', user.id)
                .eq('term', term)
                .eq('definition', definition);
            
            if (error) {
                console.error('❌ Error updating note progress:', error);
                console.warn('⚠️ Note: This might be because ease_factor columns don\'t exist yet');
                return false;
            }
            
            console.log(`📈 Successfully updated progress for "${term}"`);
            return true;
        } catch (error) {
            console.error('💥 Unexpected error updating note progress:', error);
            return false;
        }
    }
    
    // Fill up translations using dictionary API
    async function handleFillUpTranslations() {
        try {
            // Check if user has set language preferences
            const nativeLanguage = localStorage.getItem('user_native_language');
            const learningLanguage = localStorage.getItem('user_learning_language');
            
            if (!nativeLanguage || !learningLanguage) {
                alert('Language preferences not found. Please create a new deck to set your native and learning languages.');
                return;
            }
            
            // Get current vocabulary that needs translations
            const wordsToTranslate = vocabulary.filter(item => {
                // Find words that have empty or missing definitions
                return !item.lang2 || item.lang2.trim() === '' || item.lang2 === item.lang1;
            });
            
            if (wordsToTranslate.length === 0) {
                alert('All your words already have translations!');
                return;
            }
            
            const confirmMsg = `Found ${wordsToTranslate.length} words that need translations. This will automatically translate them from ${learningLanguage} to ${nativeLanguage}. Continue?`;
            if (!confirm(confirmMsg)) {
                return;
            }
            
            console.log('🔄 Starting auto-fill translations...', {
                nativeLanguage,
                learningLanguage,
                wordsToTranslate: wordsToTranslate.length
            });
            
            // Show progress
            const notesFillUpBtn = document.getElementById('notesFillUpBtn');
            const originalText = notesFillUpBtn.textContent;
            let processedCount = 0;
            
            notesFillUpBtn.textContent = `Translating... (0/${wordsToTranslate.length})`;
            notesFillUpBtn.disabled = true;
            
            // Determine language pair for MyMemory API
            let langPair;
            const learningCode = learningLanguage.split('-')[0].toLowerCase();
            const nativeCode = nativeLanguage.toLowerCase();
            
            // Format for MyMemory API: "source|target"
            langPair = `${learningCode}|${nativeCode}`;
            
            console.log('🌐 Using language pair:', langPair);
            
            // Process translations with delay to avoid rate limiting
            for (const item of wordsToTranslate) {
                try {
                    console.log(`🔤 Translating "${item.lang1}" (${processedCount + 1}/${wordsToTranslate.length})`);
                    
                    const translation = await translateText(item.lang1.trim(), langPair);
                    
                    if (translation && translation !== 'Translation failed.' && translation !== 'Translation error.' && translation.toLowerCase() !== item.lang1.toLowerCase()) {
                        // Update the vocabulary item
                        item.lang2 = translation;
                        
                        // Update in database
                        await updateNoteInDatabase(item.lang1, item.definition || item.lang2, item.lang1, translation);
                        
                        console.log(`✅ Translated "${item.lang1}" → "${translation}"`);
                    } else {
                        console.log(`⚠️ No translation found for "${item.lang1}"`);
                    }
                    
                    processedCount++;
                    notesFillUpBtn.textContent = `Translating... (${processedCount}/${wordsToTranslate.length})`;
                    
                    // Add delay to avoid rate limiting (1 second between requests)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    console.error(`❌ Error translating "${item.lang1}":`, error);
                    processedCount++;
                }
            }
            
            // Restore button and refresh notes list
            notesFillUpBtn.textContent = originalText;
            notesFillUpBtn.disabled = false;
            
            // Refresh the notes display
            if (typeof fetchNotesForManagement === 'function') {
                await fetchNotesForManagement();
            }
            
            alert(`Translation complete! Processed ${processedCount} words.`);
            
        } catch (error) {
            console.error('💥 Error in fill up translations:', error);
            alert('Error during translation process. Please try again.');
            
            // Restore button
            const notesFillUpBtn = document.getElementById('notesFillUpBtn');
            if (notesFillUpBtn) {
                notesFillUpBtn.textContent = '🔄 Fill Up Translations';
                notesFillUpBtn.disabled = false;
            }
        }
    }
    
    // Helper function to update note in database
    async function updateNoteInDatabase(oldTerm, oldDefinition, newTerm, newDefinition) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return false;
            
            const { error } = await supabaseClient
                .from('notes')
                .update({
                    term: newTerm,
                    definition: newDefinition
                })
                .eq('user_id', user.id)
                .eq('term', oldTerm);
            
            return !error;
        } catch (error) {
            console.error('Error updating note in database:', error);
            return false;
        }
    }
    
    // Show duplicate confirmation modal
    async function showDuplicateConfirmationModal(duplicates) {
        return new Promise((resolve) => {
            // Create modal dynamically
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
            modal.style.zIndex = '1005';
            
            const content = document.createElement('div');
            content.className = 'relative top-20 mx-auto p-6 border w-3/4 max-w-2xl shadow-lg rounded-md bg-white';
            
            content.innerHTML = `
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">⚠️ Duplicate Words Found</h3>
                    <p class="text-sm text-gray-600 mb-4">
                        Found ${duplicates.length} word(s) that already exist in your notes. 
                        Choose what to do with each duplicate:
                    </p>
                    
                    <div class="max-h-60 overflow-y-auto mb-4 border border-gray-200 rounded">
                        ${duplicates.map((dup, index) => `
                            <div class="p-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <strong class="text-gray-900">"${dup.term}"</strong>
                                        <div class="text-xs text-gray-600 mt-1">
                                            <div>Existing: "${dup.existingDefinition}"</div>
                                            <div>New: "${dup.newDefinition}"</div>
                                        </div>
                                    </div>
                                    <div class="ml-4">
                                        <input type="checkbox" id="replace_${index}" class="replace-checkbox rounded border-gray-300" data-term="${dup.term}">
                                        <label for="replace_${index}" class="ml-2 text-sm text-gray-700">Replace</label>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="space-x-2">
                            <button id="selectAllBtn" class="text-sm btn btn-outline">Select All</button>
                            <button id="selectNoneBtn" class="text-sm btn btn-outline">Select None</button>
                        </div>
                        <div class="space-x-3">
                            <button id="cancelUploadBtn" class="btn btn-secondary">Cancel Upload</button>
                            <button id="proceedBtn" class="btn btn-primary">Proceed</button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.appendChild(content);
            document.body.appendChild(modal);
            
            // Event handlers
            const selectAllBtn = content.querySelector('#selectAllBtn');
            const selectNoneBtn = content.querySelector('#selectNoneBtn');
            const cancelBtn = content.querySelector('#cancelUploadBtn');
            const proceedBtn = content.querySelector('#proceedBtn');
            const checkboxes = content.querySelectorAll('.replace-checkbox');
            
            selectAllBtn.addEventListener('click', () => {
                checkboxes.forEach(cb => cb.checked = true);
            });
            
            selectNoneBtn.addEventListener('click', () => {
                checkboxes.forEach(cb => cb.checked = false);
            });
            
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve({ action: 'cancel' });
            });
            
            proceedBtn.addEventListener('click', () => {
                const selectedTerms = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.dataset.term);
                
                document.body.removeChild(modal);
                resolve({ 
                    action: 'replace', 
                    selectedTerms: selectedTerms 
                });
            });
        });
    }
    
    function checkForWordPairCompletion(text, cursorPosition) {
        // Get the current line where the cursor is
        const beforeCursor = text.substring(0, cursorPosition);
        const lines = beforeCursor.split('\n');
        const currentLineText = lines[lines.length - 1];
        
        // Check if current line has a complete word pair pattern: "word - translation"
        const completePairPattern = /^(.+?)\s*-\s*(.+?)(\s+|$)/;
        const match = currentLineText.match(completePairPattern);
        
        if (match) {
            const word = match[1].trim();
            const translation = match[2].trim();
            
            // Check if both word and translation are non-empty
            if (word && translation) {
                console.log('📝 Word pair completed:', { word, translation });
                
                // Clear any existing word pair timer
                if (window.wordPairAutoSaveTimeout) {
                    clearTimeout(window.wordPairAutoSaveTimeout);
                }
                if (window.wordPairCountdownInterval) {
                    clearInterval(window.wordPairCountdownInterval);
                }
                
                // Start countdown from 20 seconds
                let countdownSeconds = 20;
                
                // Set 20-second timer specifically for this word pair
                window.wordPairAutoSaveTimeout = setTimeout(() => {
                    console.log('⏰ 20-second word pair auto-save triggered');
                    updateSaveStatus('Saving word pair...', 'text-orange-600');
                    saveLiveNotes(false); // Auto-save, not manual
                    window.wordPairAutoSaveTimeout = null;
                    if (window.wordPairCountdownInterval) {
                        clearInterval(window.wordPairCountdownInterval);
                        window.wordPairCountdownInterval = null;
                    }
                }, 20000); // 20 seconds
                
                // Real-time countdown display for console and status
                window.wordPairCountdownInterval = setInterval(() => {
                    countdownSeconds--;
                    console.log(`⏱️ Word pair auto-save countdown: ${countdownSeconds} seconds remaining`);
                    
                    if (countdownSeconds > 0) {
                        updateSaveStatus(`Auto-save in ${countdownSeconds}s...`, 'text-blue-600');
                    }
                    
                    if (countdownSeconds <= 0) {
                        clearInterval(window.wordPairCountdownInterval);
                        window.wordPairCountdownInterval = null;
                    }
                }, 1000);
                
                console.log('⏰ Set 20-second auto-save timer for word pair completion');
            }
        }
    }
    
    function handleWindowFocus() {
        // Additional focus handler for better compatibility
        if (liveNotesModal && !liveNotesModal.classList.contains('hidden')) {
            console.log('📱 Live Notes: Window focused, ensuring auto-save is active');
            if (pendingChanges && !window.autoSaveTimeout) {
                setupAutoSaveTimer();
            }
        }
    }
    
    function handleWindowBlur() {
        // Window lost focus - save any pending changes
        if (pendingChanges && liveNotesModal && !liveNotesModal.classList.contains('hidden')) {
            console.log('📱 Live Notes: Window lost focus, saving pending changes');
            saveLiveNotes();
        }
    }

    function handleNotepadInput(event) {
        // Get content from contenteditable div
        let content = getNotesTextContent();
        let originalContent = content;
        
        // Auto-add space before dashes if missing
        // This handles cases like "word-" -> "word -" and "word-something" -> "word - something"
        content = content.replace(/(\w)-(\s|$)/g, '$1 -$2');
        
        // Update content if we made changes
        if (content !== originalContent) {
            setNotesContent(content);
            console.log('🔧 Auto-corrected spacing: dash without space -> dash with space');
        }
        
        notepadContent = content;
        pendingChanges = true;
        
        // Save content to localStorage for persistence
        localStorage.setItem('live_notes_content', notepadContent);
        
        // Clear existing auto-advance timer
        if (autoAdvanceTimer) {
            clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = null;
        }
        
        // Get cursor position for contenteditable div
        const selection = window.getSelection();
        let cursorPosition = 0;
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(liveNotesTextarea);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            cursorPosition = preCaretRange.toString().length;
        }
        
        const currentValue = notepadContent;
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
        updatePlaceholderVisibility();
        
        // Check for word pair completion and trigger 20-second auto-save
        checkForWordPairCompletion(currentValue, cursorPosition);
        
        // Debounced auto-save - clear existing timeout and set new one
        if (window.autoSaveTimeout) {
            clearTimeout(window.autoSaveTimeout);
        }
        setupAutoSaveTimer();
        
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
        // Get content from contenteditable div
        const content = getNotesTextContent();
        console.log('💾 parseNotepadContentForSaving - Raw content:', content);
        
        // Split content into lines
        const lines = content.split('\n');
        console.log('💾 parseNotepadContentForSaving - Lines:', lines);
        
        // Parse all lines with content (including incomplete ones)
        const completedData = [];
        
        lines.forEach((line, index) => {
            // Skip empty lines
            if (line.trim() === '') return;
            
            let trimmedLine = line.trim();
            if (trimmedLine === '') return;
            
            console.log(`💾 Processing line ${index}: "${trimmedLine}"`);
            
            // Normalize symbols first
            trimmedLine = normalizeSymbolsInText(trimmedLine);
            
            // Look for dash separator (-, –, —)
            const dashMatches = trimmedLine.match(/^(.+?)\s*[-–—]\s*(.*)$/);
            if (dashMatches) {
                const word = dashMatches[1].trim();
                const translation = dashMatches[2].trim();
                
                console.log(`💾 Found word: "${word}", translation: "${translation}" (empty: ${translation === ''})`);
                
                // Save both complete pairs AND incomplete ones (word without translation)
                if (word) {
                    const hasCompletePattern = dashMatches && word && translation;
                    const isIncomplete = word && !translation; // Word with dash but no translation
                    
                    console.log(`💾 Word "${word}" - hasCompletePattern: ${hasCompletePattern}, isIncomplete: ${isIncomplete}, will save: true`);
                    
                    // Save all word pairs - both complete and incomplete
                    completedData.push({
                        targetLang: word,
                        translation: translation || '', // Allow empty translation for incomplete pairs
                        lineNumber: index,
                        saved: false,
                        isIncomplete: isIncomplete,
                        wasEdited: false // Simplified - consider all as edited for saving
                    });
                    
                    console.log(`✅ Added to save queue: "${word}" -> "${translation || '[incomplete]'}"`);
                }
            }
        });
        
        console.log('💾 parseNotepadContentForSaving - Total items to save:', completedData.length);
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
        // Get current selection and position for contenteditable
        const selection = window.getSelection();
        let currentContent = getNotesTextContent();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(liveNotesTextarea);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            const cursorPos = preCaretRange.toString().length;
            
            const beforeCursor = currentContent.substring(0, cursorPos);
            const afterCursor = currentContent.substring(cursorPos);
            
            // Add new line at cursor position
            let newText;
            if (beforeCursor.endsWith('\n') || beforeCursor === '') {
                newText = beforeCursor + '\n' + afterCursor;
            } else {
                newText = beforeCursor + '\n\n' + afterCursor;
            }
            
            setNotesContent(newText);
            
            // Position cursor at the start of the new line
            const newCursorPos = beforeCursor.length + (beforeCursor.endsWith('\n') || beforeCursor === '' ? 1 : 2);
            setCursorPosition(liveNotesTextarea, newCursorPos);
        } else {
            // Fallback: add line at the end
            const newText = currentContent + (currentContent.endsWith('\n') ? '\n' : '\n\n');
            setNotesContent(newText);
            setCursorPosition(liveNotesTextarea, newText.length);
        }
        
        liveNotesTextarea.focus();
        
        // Update content tracking
        notepadContent = getNotesTextContent();
        parseNotepadContent();
        updateLineAndParsedCounts();
        pendingChanges = true;
        updateSaveStatus();
    }
    
    function goToPreviousLine() {
        // Get current cursor position for contenteditable
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(liveNotesTextarea);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const cursorPos = preCaretRange.toString().length;
        
        const text = getNotesTextContent();
        const beforeCursor = text.substring(0, cursorPos);
        
        // Find the previous line break
        const lastLineBreak = beforeCursor.lastIndexOf('\n');
        if (lastLineBreak > 0) {
            const secondLastLineBreak = beforeCursor.lastIndexOf('\n', lastLineBreak - 1);
            const previousLineStart = secondLastLineBreak + 1;
            const previousLineEnd = lastLineBreak;
            
            // Move cursor to the beginning of the previous line for better UX
            setCursorPosition(liveNotesTextarea, previousLineStart);
            liveNotesTextarea.focus();
        } else if (lastLineBreak === 0) {
            // We're on the second line, go to the beginning of the first line
            setCursorPosition(liveNotesTextarea, 0);
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
    
    async function saveLiveNotes(isManualSave = false) {
        console.log('💾 saveLiveNotes: Starting live notes save process...');
        
        // Update save status to show saving
        updateSaveStatus('Saving...', 'text-orange-600');
        
        try {
            // Test database connection first
            const connectionTest = await testDatabaseConnection();
            if (!connectionTest) {
                console.error('❌ saveLiveNotes: Database connection test failed');
                updateSaveStatus('Connection Failed', 'text-red-600');
                
                // Try to restore connection
                await restoreLiveNotesConnection();
                return;
            }
            
            // Parse only completed lines (not the current line being typed)
            const completedNotesData = parseNotepadContentForSaving();
            console.log('💾 saveLiveNotes: Parsed completed lines, found', completedNotesData.length, 'completed notes');
            
            if (completedNotesData.length === 0) {
                console.log('💾 saveLiveNotes: No completed notes to save');
                updateSaveStatus('All saved', 'text-green-600');
                return;
            }
            
            // Filter and prepare notes for saving
            const notesToSave = completedNotesData
                .filter(note => {
                    const shouldSave = note.targetLang.trim() !== ''; // Only need a word, translation can be empty
                    console.log(`💾 Filter check for "${note.targetLang}" with translation "${note.translation}": shouldSave=${shouldSave}`);
                    return shouldSave;
                })
                .map(note => ({
                    lang1: note.targetLang.trim(),
                    lang2: note.translation ? note.translation.trim() : '', // Allow empty translation for incomplete pairs
                    lineNumber: note.lineNumber, // Track line number for replacements
                    isIncomplete: note.isIncomplete || false, // Track if this is incomplete
                    isEdit: note.wasEdited || false // Track if this is an edit to existing content
                }));
            
            console.log('💾 saveLiveNotes: Prepared notes for saving:', {
                originalCount: completedNotesData.length,
                validCount: notesToSave.length,
                sampleNotes: notesToSave.slice(0, 2)
            });
            
            if (notesToSave.length === 0) {
                console.log('💾 saveLiveNotes: No valid notes to save');
                updateSaveStatus('All saved', 'text-green-600');
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
            updateSaveStatus('All saved', 'text-green-600');
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
            
            // Update save status to success
            pendingChanges = false; // Reset pending changes flag
            updateSaveStatus('All saved', 'text-green-600');
        } else {
            console.error('❌ saveLiveNotes: Failed to save notes');
            updateSaveStatus('Save failed', 'text-red-600');
        }
        
        } catch (error) {
            console.error('💥 saveLiveNotes: Unexpected error during save:', error);
            updateSaveStatus('Connection Error', 'text-red-600');
            
            // Try to restore connection for next time
            setTimeout(restoreLiveNotesConnection, 2000);
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
            setNotesContent('');
            pendingChanges = false;
            updateSaveStatus();
            updateLineAndParsedCounts();
            updatePlaceholderVisibility();
            liveNotesTextarea.focus();
        }
    }
    
    // Handle Live Notes batch translation functionality
    /**
     * Get user-friendly language name from language code
     */
    function getLangaugeName(langCode) {
        const languageNames = {
            'es-ES': 'Spanish',
            'es': 'Spanish',
            'EN': 'English',
            'en': 'English',
            'fr-FR': 'French',
            'fr': 'French',
            'de-DE': 'German',
            'de': 'German',
            'pt-PT': 'Portuguese',
            'pt': 'Portuguese',
            'it-IT': 'Italian',
            'it': 'Italian',
            'nl-NL': 'Dutch',
            'nl': 'Dutch',
            'ru-RU': 'Russian',
            'ru': 'Russian',
            'zh-CN': 'Chinese',
            'zh': 'Chinese',
            'ja-JP': 'Japanese',
            'ja': 'Japanese',
            'ko-KR': 'Korean',
            'ko': 'Korean',
            'ar-SA': 'Arabic',
            'ar': 'Arabic'
        };
        return languageNames[langCode] || langCode;
    }

    async function handleLiveNotesTranslation() {
        try {
            // Use the global currentDeck variable or fallback to finding it if needed
            if (!currentDeck && currentlySelectedDeckId) {
                currentDeck = userDecks.find(deck => deck.id === currentlySelectedDeckId);
            }
            
            let learningLanguage, nativeLanguage;
            
            if (currentDeck) {
                // Use deck language settings
                learningLanguage = currentDeck.language; // Language being learned (e.g., 'es-ES')
                nativeLanguage = currentDeck.definition_lang; // Native language (e.g., 'EN')
            } else {
                // Fallback to localStorage for compatibility
                learningLanguage = localStorage.getItem('user_learning_language');
                nativeLanguage = localStorage.getItem('user_native_language');
            }
            
            if (!nativeLanguage || !learningLanguage) {
                alert('Deck language preferences not found. Please select a deck or create a new deck to set language preferences.');
                return;
            }
            
            // Get plain text content from contenteditable - this removes HTML formatting
            const text = getNotesTextContent();
            console.log('🔍 Translation detection - Raw text content:', text);
            
            const lines = text.split('\n');
            console.log('🔍 Translation detection - Split into lines:', lines);
            
            // Find lines that need translation (end with dash but no definition)
            const linesToTranslate = [];
            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                console.log(`🔍 Processing line ${index}: "${trimmedLine}" (length: ${trimmedLine.length})`);
                
                // Check if line ends with just a dash (needs translation)
                // This handles cases where we have: "word -" but not "word - translation"
                const isDashOnly = trimmedLine.match(/^.+\s*-\s*$/);
                const hasTranslation = trimmedLine.match(/^.+\s*-\s+.+$/);
                
                // Additional debugging: check different patterns
                const endsWithDash = trimmedLine.endsWith('-');
                const endsWithDashSpace = trimmedLine.endsWith(' -');
                const containsDash = trimmedLine.includes('-');
                
                console.log(`🔍 Line ${index} debugging:`, {
                    isDashOnly: !!isDashOnly,
                    hasTranslation: !!hasTranslation,
                    endsWithDash,
                    endsWithDashSpace,
                    containsDash,
                    trimmedLine
                });
                
                if (isDashOnly && !hasTranslation) {
                    const wordToTranslate = trimmedLine.replace(/\s*-\s*$/, '').trim();
                    if (wordToTranslate) {
                        console.log(`✅ Found word to translate: "${wordToTranslate}"`);
                        linesToTranslate.push({ index, word: wordToTranslate, originalLine: line });
                    }
                } else {
                    console.log(`❌ Line ${index} doesn't match translation criteria`);
                }
            });
            
            if (linesToTranslate.length === 0) {
                alert('No incomplete translations found. Add words ending with a dash (e.g., "apple -") to translate them.');
                return;
            }
            
            // Create user-friendly language names for the confirmation
            const learningLangName = getLangaugeName(learningLanguage);
            const nativeLangName = getLangaugeName(nativeLanguage);
            
            const confirmMsg = `Found ${linesToTranslate.length} word(s) that need translation. This will automatically translate them from ${learningLangName} to ${nativeLangName} with enhanced dictionary details. Continue?`;
            if (!confirm(confirmMsg)) {
                return;
            }
            
            // Show loading state
            translateTextBtn.disabled = true;
            translateTextBtn.textContent = '🔄 Translating...';
            
            console.log('🤖 Starting enhanced Live Notes batch translation...', {
                nativeLanguage,
                learningLanguage,
                wordsToTranslate: linesToTranslate.length
            });
            
            // Determine language codes for translation API
            const learningCode = learningLanguage.split('-')[0].toLowerCase(); // 'es' from 'es-ES'
            const nativeCode = nativeLanguage.toLowerCase(); // 'en' from 'EN'
            
            // Use enhanced batch translation with dictionary enrichment
            const result = await batchTranslateWithDictionaryEnrichment(text, learningCode, nativeCode);
            
            // Update textarea content with enhanced translations
            setNotesContent(result.translatedText);
            notepadContent = getNotesTextContent();
            parseNotepadContent();
            
            // Mark as having pending changes for auto-save
            pendingChanges = true;
            
            // Show success message
            const message = result.translatedCount > 0 
                ? `✅ Successfully translated ${result.translatedCount} out of ${linesToTranslate.length} words with enhanced dictionary details!`
                : `❌ No translations could be completed. Please check your internet connection.`;
                
            updateSaveStatus(message);
            
            console.log(`🤖 Enhanced Live Notes translation complete: ${result.translatedCount}/${linesToTranslate.length} successful`);
            
        } catch (error) {
            console.error('❌ Live Notes translation error:', error);
            updateSaveStatus('Translation failed');
        } finally {
            // Restore button state
            translateTextBtn.disabled = false;
            translateTextBtn.textContent = 'Translate Text';
        }
    }
    
    /**
     * Translation function that tries Chrome AI first, then falls back to MyMemory API
     */
    async function translateTextWithFallback(text, langPair) {
        // First try Chrome AI if available
        if ('ai' in window && typeof window.ai.createTextTranslator === 'function') {
            try {
                console.log('🤖 Using Chrome AI Translator for:', text);
                const [sourceLang, targetLang] = langPair.split('|');
                const translator = await window.ai.createTextTranslator({
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang
                });
                const result = await translator.translate(text);
                if (result && result.trim()) {
                    return result.trim();
                }
            } catch (error) {
                console.log('Chrome AI translation failed, falling back to MyMemory API:', error);
            }
        }
        
        // Fallback to MyMemory API
        return translateWithMyMemoryAPI(text, langPair);
    }
    
    /**
     * Translation using MyMemory API
     */
    async function translateWithMyMemoryAPI(text, langPair) {
        if (!text.trim()) return '';
        
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.responseStatus !== 200) {
                console.error("MyMemory API Error:", data.responseDetails);
                return null;
            }
            
            return data.responseData.translatedText;
        } catch (error) {
            console.error('MyMemory API translation error:', error);
            return null;
        }
    }

    /**
     * Get dictionary meanings for a word including parts of speech and synonyms
     * Uses Free Dictionary API with native language support
     */
    async function getDictionaryMeanings(word, nativeLanguageCode = 'en') {
        if (!word || typeof word !== 'string') return null;
        
        // Map language codes to dictionary API language codes
        const langMap = {
            'en': 'en',
            'es': 'es',
            'fr': 'fr', 
            'de': 'de',
            'pt': 'pt',
            'it': 'it',
            'ru': 'ru',
            'ja': 'ja',
            'ko': 'ko',
            'hi': 'hi',
            'ar': 'ar'
        };
        
        const targetLang = langMap[nativeLanguageCode.toLowerCase()] || 'en';
        
        try {
            // Try the native language dictionary first
            let apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/${targetLang}/${encodeURIComponent(word.toLowerCase())}`;
            let response = await fetch(apiUrl);
            
            // If native language fails, fallback to English
            if (!response.ok && targetLang !== 'en') {
                console.log(`Dictionary API: No entry found for "${word}" in ${targetLang}, trying English...`);
                apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
                response = await fetch(apiUrl);
            }
            
            if (!response.ok) {
                console.log(`Dictionary API: No entry found for "${word}" in any language`);
                return null;
            }
            
            const data = await response.json();
            if (!data || !Array.isArray(data) || data.length === 0) {
                return null;
            }
            
            const meanings = [];
            const firstEntry = data[0];
            
            if (firstEntry.meanings && Array.isArray(firstEntry.meanings)) {
                firstEntry.meanings.forEach(meaning => {
                    if (meaning.partOfSpeech && meaning.definitions && Array.isArray(meaning.definitions)) {
                        const partOfSpeech = meaning.partOfSpeech.toLowerCase();
                        
                        // Only include noun, verb, and adjective as requested
                        if (['noun', 'verb', 'adjective'].includes(partOfSpeech)) {
                            const definition = meaning.definitions[0]?.definition || '';
                            const synonyms = meaning.definitions[0]?.synonyms || [];
                            
                            meanings.push({
                                partOfSpeech: partOfSpeech,
                                definition: definition,
                                synonyms: synonyms.slice(0, 3) // Limit to first 3 synonyms
                            });
                        }
                    }
                });
            }
            
            return meanings.length > 0 ? meanings : null;
        } catch (error) {
            console.error('Dictionary API error:', error);
            return null;
        }
    }

    /**
     * Enhanced batch translation function with dictionary enrichment
     * Processes text blocks, finds incomplete lines, and enriches them with
     * translations, parts of speech, and synonyms
     * Caps automatic translation at 45 characters
     */
    async function batchTranslateWithDictionaryEnrichment(textContent, sourceLang, targetLang) {
        const lines = textContent.split('\n');
        const newLines = [];
        let linesTranslated = 0;

        console.log("Starting enhanced batch translation...");

        for (const line of lines) {
            // Find lines that look like "word -" (incomplete translations)
            // Use same detection logic as handleLiveNotesTranslation
            const trimmedLine = line.trim();
            if (trimmedLine.match(/^.+\s*-\s*$/) && !trimmedLine.match(/^.+\s*-\s+.+$/)) {
                const originalWord = trimmedLine.replace(/\s*-\s*$/, '').trim();
                
                // Cap automatic translation at 45 characters
                if (originalWord.length > 45) {
                    console.log(`Skipping translation for "${originalWord}" - exceeds 45 character limit`);
                    newLines.push(line);
                    continue;
                }

                // 1. Translate the word to target language
                const langPair = `${sourceLang}|${targetLang}`;
                const translatedWord = await translateTextWithFallback(originalWord, langPair);

                if (translatedWord && translatedWord.toLowerCase() !== originalWord.toLowerCase()) {
                    // 2. Get dictionary details for the translated word in the target (native) language
                    const meanings = await getDictionaryMeanings(translatedWord, targetLang);

                    if (meanings && meanings.length > 0) {
                        // 3. Filter for only noun, verb, and adjective
                        const relevantMeanings = meanings.filter(m =>
                            ["noun", "verb", "adjective"].includes(m.partOfSpeech)
                        );

                        if (relevantMeanings.length > 0) {
                            // 4. Format the details string
                            const partsOfSpeechDetails = relevantMeanings.map(m => {
                                const abbreviation = {
                                    "noun": "n",
                                    "verb": "v",
                                    "adjective": "adj"
                                }[m.partOfSpeech];

                                let detail = `(${abbreviation}.)`;
                                
                                // Add definition if available
                                if (m.definition && m.definition.length > 0) {
                                    // Truncate definition to keep it concise
                                    const shortDef = m.definition.length > 50 
                                        ? m.definition.substring(0, 50) + "..."
                                        : m.definition;
                                    detail += ` ${shortDef}`;
                                }
                                
                                // Add synonyms if available
                                if (m.synonyms && m.synonyms.length > 0) {
                                    const synList = m.synonyms.slice(0, 2).join(", ");
                                    detail += ` [syn: ${synList}]`;
                                }
                                
                                return detail;
                            }).join("; ");

                            // Format: "original - translated (enhanced details) ⭐"
                            const enhancedLine = `${originalWord} - ${translatedWord} ${partsOfSpeechDetails} ⭐`;
                            newLines.push(enhancedLine);
                            linesTranslated++;
                            
                            console.log(`✅ Enhanced translation: "${originalWord}" → "${translatedWord}" with details`);
                        } else {
                            // No relevant meanings found, use simple translation
                            const simpleLine = `${originalWord} - ${translatedWord} ⭐`;
                            newLines.push(simpleLine);
                            linesTranslated++;
                            
                            console.log(`✅ Simple translation: "${originalWord}" → "${translatedWord}"`);
                        }
                    } else {
                        // No dictionary details available, use simple translation
                        const simpleLine = `${originalWord} - ${translatedWord} ⭐`;
                        newLines.push(simpleLine);
                        linesTranslated++;
                        
                        console.log(`✅ Simple translation: "${originalWord}" → "${translatedWord}" (no dictionary data)`);
                    }
                } else {
                    console.log(`❌ Translation failed for: ${originalWord}`);
                    newLines.push(line);
                }
            } else {
                // Line doesn't need translation, keep as is
                newLines.push(line);
            }
        }

        console.log(`Enhanced batch translation complete: ${linesTranslated} lines translated`);
        return {
            translatedText: newLines.join('\n'),
            translatedCount: linesTranslated
        };
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
        const currentValue = getNotesTextContent();
        
        // Find the position of the text that was translated
        const beforeCursor = currentValue.substring(0, cursorPosition);
        const lastDashIndex = beforeCursor.lastIndexOf(' - ');
        
        if (lastDashIndex !== -1) {
            // Replace the content after the dash with the translation
            const beforeDash = currentValue.substring(0, lastDashIndex + 3); // Include " - "
            const afterCursor = currentValue.substring(cursorPosition);
            const newValue = beforeDash + translation + afterCursor;
            
            setNotesContent(newValue);
            
            // Focus on the contenteditable element
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

    // --- CSV EXPORT FUNCTIONS ---
    
    /**
     * Function to convert notes to CSV format
     */
    function convertNotesToCSV(notes) {
        // Add header row
        let csvContent = "Word,Translation,Language\n";

        // Add data rows
        notes.forEach(note => {
            const word = note.lang1.replace(/"/g, '""'); // Escape quotes
            const translation = note.lang2.replace(/"/g, '""');
            const language = note.term_lang || csvUploadedTargetLanguage || 'en-GB';

            csvContent += `"${word}","${translation}","${language}"\n`;
        });

        return csvContent;
    }

    /**
     * Function to trigger download of CSV file
     */
    function downloadCSV(csvContent, filename = 'vocabulary.csv') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Function to handle the export action
     */
    function exportNotesToCSV() {
        // Get filtered notes or all notes
        const notesToExport = getFilteredVocabulary();

        if (notesToExport.length === 0) {
            alert('No notes to export.');
            return;
        }

        // Generate CSV and download
        const csvContent = convertNotesToCSV(notesToExport);
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `vocabulary-${timestamp}.csv`;
        
        downloadCSV(csvContent, filename);
        
        // Show success message
        alert(`Successfully exported ${notesToExport.length} notes to ${filename}`);
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
        
        // Setup CSV export functionality
        const exportNotesBtn = document.getElementById('exportNotesBtn');
        if (exportNotesBtn) {
            exportNotesBtn.addEventListener('click', exportNotesToCSV);
            console.log('📚 initializeNotesManagement: CSV export functionality setup complete');
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
            
            // Add a single, safer edit button with confirmation
            const editBtn = document.createElement('button');
            editBtn.className = 'ml-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded edit-btn-safe';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit note (hold for 0.25 seconds)';
            
            let editTimeout = null;
            let isEditPressed = false;
            
            const startEditTimer = () => {
                isEditPressed = true;
                editBtn.style.backgroundColor = '#fbbf24';
                editBtn.innerHTML = '⏱️';
                editBtn.title = 'Hold to edit... (keep holding)';
                
                editTimeout = setTimeout(() => {
                    if (isEditPressed) {
                        console.log('✏️ populateNotesList: Safe edit triggered for note:', note);
                        editNote(originalIndex, note);
                        resetEditButton();
                    }
                }, 250); // 250ms hold required (1/4 of previous duration)
            };
            
            const cancelEditTimer = () => {
                isEditPressed = false;
                if (editTimeout) {
                    clearTimeout(editTimeout);
                    editTimeout = null;
                }
                resetEditButton();
            };
            
            const resetEditButton = () => {
                editBtn.style.backgroundColor = '';
                editBtn.innerHTML = '✏️';
                editBtn.title = 'Edit note (hold for 0.25 seconds)';
            };
            
            // Mouse events
            editBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startEditTimer();
            });
            
            editBtn.addEventListener('mouseup', cancelEditTimer);
            editBtn.addEventListener('mouseleave', cancelEditTimer);
            
            // Touch events for mobile
            editBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startEditTimer();
            });
            
            editBtn.addEventListener('touchend', cancelEditTimer);
            editBtn.addEventListener('touchcancel', cancelEditTimer);
            
            // Add delete button with click-only delete (no touch instant delete)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded delete-btn-safe';
            deleteBtn.innerHTML = '✕';
            deleteBtn.title = 'Delete note';
            
            // Only allow delete via explicit click on X button
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ populateNotesList: Delete button clicked for note:', note);
                deleteNote(originalIndex, note);
            });
            
            // Add touch event for mobile delete button
            deleteBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ populateNotesList: Delete button touched for note:', note);
                deleteNote(originalIndex, note);
            });
            
            noteItem.appendChild(noteContent);
            noteItem.appendChild(editBtn);
            noteItem.appendChild(deleteBtn);
            
            // Add swipe-to-delete for mobile (40% threshold)
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            let hasMoved = false;
            
            noteItem.addEventListener('touchstart', (e) => {
                // Only start drag if not touching the delete button
                if (e.target.closest('.delete-btn-safe') || e.target.closest('.edit-btn-safe')) {
                    console.log('📱 Touch start on delete/edit button - skipping swipe');
                    return;
                }
                console.log('📱 Touch start for swipe detection');
                startX = e.touches[0].clientX;
                currentX = startX;
                isDragging = true;
                hasMoved = false;
            }, { passive: true });
            
            noteItem.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                currentX = e.touches[0].clientX;
                const diffX = startX - currentX;
                hasMoved = Math.abs(diffX) > 10; // Minimum movement to be considered a swipe
                
                if (diffX > 50) {
                    const elementWidth = noteItem.offsetWidth;
                    const maxSwipe = elementWidth * 0.4; // 40% of element width
                    const swipeDistance = Math.min(diffX, maxSwipe);
                    
                    console.log('📱 Swiping - diffX:', diffX, 'elementWidth:', elementWidth, 'swipeDistance:', swipeDistance);
                    noteItem.style.transform = `translateX(-${swipeDistance}px)`;
                    noteItem.style.backgroundColor = diffX > maxSwipe * 0.8 ? '#fee2e2' : '#fef3cd';
                }
            }, { passive: true });
            
            noteItem.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                
                console.log('📱 Touch end - isDragging:', isDragging, 'hasMoved:', hasMoved);
                const diffX = startX - currentX;
                const elementWidth = noteItem.offsetWidth;
                const deleteThreshold = elementWidth * 0.4; // 40% of element width
                
                console.log('📱 Swipe end - diffX:', diffX, 'deleteThreshold:', deleteThreshold);
                
                if (hasMoved && diffX > deleteThreshold) {
                    console.log('📱 populateNotesList: Swipe delete triggered (40% threshold) for note:', note);
                    deleteNote(originalIndex, note);
                } else {
                    // Reset position if not enough swipe
                    console.log('📱 Swipe not enough - resetting position');
                    noteItem.style.transform = '';
                    noteItem.style.backgroundColor = '';
                }
                
                isDragging = false;
                hasMoved = false;
            }, { passive: true });
            
            // Prevent accidental delete on simple tap
            noteItem.addEventListener('touchcancel', () => {
                noteItem.style.transform = '';
                noteItem.style.backgroundColor = '';
                isDragging = false;
                hasMoved = false;
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
                    case 'hour':
                        return timeDiff <= 60 * 60 * 1000; // 1 hour
                    case 'yesterday':
                        // Yesterday: 24-48 hours ago
                        return timeDiff > 24 * 60 * 60 * 1000 && timeDiff <= 48 * 60 * 60 * 1000;
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
        console.log('✏️ Starting inline edit for note:', note, 'at index:', index);
        
        // Find the note item in the DOM
        const noteItems = document.querySelectorAll('.note-item');
        let targetNoteItem = null;
        
        // Find the correct note item by matching the content
        for (let item of noteItems) {
            const noteContent = item.querySelector('.flex-1');
            if (noteContent && noteContent.textContent.includes(note.lang1) && noteContent.textContent.includes(note.lang2)) {
                targetNoteItem = item;
                break;
            }
        }
        
        if (!targetNoteItem) {
            console.error('❌ Could not find note item in DOM');
            return;
        }
        
        // Get the content div
        const noteContent = targetNoteItem.querySelector('.flex-1');
        const editBtn = targetNoteItem.querySelector('.edit-btn');
        const deleteBtn = targetNoteItem.querySelector('.delete-btn');
        
        // Store original content
        const originalContent = noteContent.innerHTML;
        
        // Replace content with input fields
        noteContent.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex-1">
                    <input type="text" id="editTermInput_${index}" value="${note.lang1}" 
                           class="font-medium text-gray-900 border-b-2 border-teal-500 bg-transparent focus:outline-none focus:border-teal-700 mr-2"
                           style="min-width: 120px;">
                    <span class="text-gray-600 mx-2">—</span>
                    <input type="text" id="editDefinitionInput_${index}" value="${note.lang2}" 
                           class="text-gray-700 border-b-2 border-teal-500 bg-transparent focus:outline-none focus:border-teal-700"
                           style="min-width: 120px;">
                </div>
            </div>
        `;
        
        // Replace edit button with save (floppy disk) button
        editBtn.innerHTML = '💾';
        editBtn.title = 'Save changes';
        editBtn.className = 'ml-2 text-green-500 hover:text-green-700 hover:bg-green-50 p-2 rounded save-btn';
        
        // Hide delete button during edit
        deleteBtn.style.display = 'none';
        
        // Focus on the first input
        const termInput = document.getElementById(`editTermInput_${index}`);
        const definitionInput = document.getElementById(`editDefinitionInput_${index}`);
        termInput.focus();
        termInput.select();
        
        // Handle Enter key to move between fields
        termInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                definitionInput.focus();
                definitionInput.select();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
        
        definitionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
        
        // Function to cancel edit
        const cancelEdit = () => {
            noteContent.innerHTML = originalContent;
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit note';
            editBtn.className = 'ml-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded edit-btn';
            deleteBtn.style.display = 'block';
            
            // Re-attach original click listener to edit button
            editBtn.removeEventListener('click', saveEdit);
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editNote(index, note);
            });
        };
        
        // Function to save edit
        const saveEdit = async () => {
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
                
                // Update the note object for future edits
                note.lang1 = newTerm;
                note.lang2 = newDefinition;
                
                // Update the display
                noteContent.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="flex-1">
                            <span class="font-medium text-gray-900 click-to-speak" data-text="${newTerm}" data-lang="${note.term_lang || csvUploadedTargetLanguage}">${newTerm}</span>
                            <span class="text-gray-600 mx-2">—</span>
                            <span class="text-gray-700 click-to-speak" data-text="${newDefinition}" data-lang="en">${newDefinition}</span>
                        </div>
                    </div>
                `;
                
                // Re-attach click listener for TTS
                noteContent.addEventListener('click', (e) => {
                    if (e.target.classList.contains('click-to-speak')) {
                        // Only allow clicking on target language (first word)
                        if (e.target.dataset.text === newTerm) {
                            const text = e.target.dataset.text;
                            const lang = e.target.dataset.lang;
                            console.log('🔊 populateNotesList: Speaking text:', text, 'in language:', lang);
                            speakText(text, lang);
                        }
                    }
                });
                
                // Restore edit button
                editBtn.innerHTML = '✏️';
                editBtn.title = 'Edit note';
                editBtn.className = 'ml-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded edit-btn';
                deleteBtn.style.display = 'block';
                
                // Re-attach edit functionality
                editBtn.removeEventListener('click', saveEdit);
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editNote(index, note);
                });
                
            } catch (error) {
                console.error('Error editing note:', error);
                alert('Error editing note');
            }
        };
        
        // Replace the click handler for the save button
        editBtn.removeEventListener('click', editNote);
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            saveEdit();
        });
    }
    
    // Voice selection cache to persist through session
    let selectedVoices = {
        'en-GB': null,
        'en-US': null, 
        'es-ES': null,
        'es-US': null,
        'fr-FR': null,
        'de-DE': null,
        'pt-PT': null,
        'pt-BR': null,
        'nl-NL': null
    };
    let voicesLoaded = false;
    let voiceLoadingWarningShown = false;
    
    // Check if voices were loaded in this session
    function isVoicesLoadedInSession() {
        return sessionStorage.getItem('voicesLoadedThisSession') === 'true';
    }
    
    // Mark voices as loaded for this session
    function markVoicesLoadedInSession() {
        sessionStorage.setItem('voicesLoadedThisSession', 'true');
    }
    
    // Initialize voice selection when voices are available
    function initializeVoiceSelection() {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return false;
        
        console.log('🎙️ Initializing voice selection with', voices.length, 'available voices');
        
        // Select high-quality voices for each language (prioritizing Google voices when available)
        selectedVoices['en-GB'] = findBestVoice(voices, 'en-GB', ['Google UK English Male', 'Arthur', 'Daniel', 'Oliver', 'Karen']);
        selectedVoices['en-US'] = findBestVoice(voices, 'en-US', ['Alex', 'Samantha', 'Victoria', 'Allison']);
        selectedVoices['es-ES'] = findBestVoice(voices, 'es-ES', ['Google Español', 'Monica', 'Jorge', 'Marisol']);
        selectedVoices['es-US'] = findBestVoice(voices, 'es-US', ['Diego', 'Esperanza', 'Juan']);
        selectedVoices['fr-FR'] = findBestVoice(voices, 'fr-FR', ['Amelie', 'Thomas']);
        selectedVoices['de-DE'] = findBestVoice(voices, 'de-DE', ['Anna', 'Stefan']);
        selectedVoices['pt-PT'] = findBestVoice(voices, 'pt-PT', ['Catarina']);
        selectedVoices['pt-BR'] = findBestVoice(voices, 'pt-BR', ['Luciana']);
        selectedVoices['nl-NL'] = findBestVoice(voices, 'nl-NL', ['Ellen']);
        
        voicesLoaded = true;
        markVoicesLoadedInSession();
        hideVoiceLoadingWarning();
        
        // Log selected voices
        Object.entries(selectedVoices).forEach(([lang, voice]) => {
            if (voice) {
                console.log(`🎙️ Selected voice for ${lang}: ${voice.name} (${voice.voiceURI})`);
            }
        });
        
        return true;
    }
    
    // Find the best voice for a language, preferring specific high-quality voice names
    function findBestVoice(voices, targetLang, preferredNames = []) {
        // First try to find preferred high-quality voices (exact match first, then includes)
        for (const preferredName of preferredNames) {
            // Try exact match first (for Google voices)
            let voice = voices.find(v => 
                v.lang.startsWith(targetLang.split('-')[0]) && 
                v.name.toLowerCase() === preferredName.toLowerCase()
            );
            if (voice) return voice;
            
            // Fall back to includes match
            voice = voices.find(v => 
                v.lang.startsWith(targetLang.split('-')[0]) && 
                v.name.toLowerCase().includes(preferredName.toLowerCase())
            );
            if (voice) return voice;
        }
        
        // Fall back to any voice with exact language match
        let voice = voices.find(v => v.lang === targetLang);
        if (voice) return voice;
        
        // Fall back to any voice with same language code
        voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
        if (voice) return voice;
        
        return null;
    }
    
    // Wait for voices to load and initialize selection
    function ensureVoicesLoaded() {
        return new Promise((resolve) => {
            // If voices were already loaded in this session, skip waiting
            if (isVoicesLoadedInSession() && voicesLoaded) {
                resolve();
                return;
            }
            
            if (voicesLoaded || initializeVoiceSelection()) {
                resolve();
                return;
            }
            
            // Show warning if not loaded in session and not shown yet
            if (!isVoicesLoadedInSession() && !voiceLoadingWarningShown) {
                showVoiceLoadingWarning();
                voiceLoadingWarningShown = true;
            }
            
            // Wait for voiceschanged event
            const handleVoicesChanged = () => {
                if (initializeVoiceSelection()) {
                    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
                    resolve();
                }
            };
            
            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
            
            // Fallback timeout
            setTimeout(() => {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
                hideVoiceLoadingWarning();
                resolve();
            }, 10000); // Increased timeout to 10 seconds for better loading
        });
    }
    
    // Show voice loading warning
    function showVoiceLoadingWarning() {
        // Create warning overlay if it doesn't exist
        let voiceWarning = document.getElementById('voiceLoadingWarning');
        if (!voiceWarning) {
            voiceWarning = document.createElement('div');
            voiceWarning.id = 'voiceLoadingWarning';
            voiceWarning.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            voiceWarning.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
                    <div class="mb-4">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">🎙️ Loading High-Quality Voices</h3>
                        <p class="text-gray-600 mb-4">Please wait while we download premium Google voices for the best audio experience. This only happens once per session.</p>
                        <div class="text-sm text-gray-500">
                            <p>• Premium voice quality with Google voices</p>
                            <p>• Enhanced pronunciation accuracy</p>
                            <p>• Better learning experience</p>
                        </div>
                    </div>
                    <div class="text-xs text-gray-400">
                        Loading voices... Please do not start any games yet.
                    </div>
                </div>
            `;
            document.body.appendChild(voiceWarning);
        }
        voiceWarning.classList.remove('hidden');
    }
    
    // Hide voice loading warning
    function hideVoiceLoadingWarning() {
        const voiceWarning = document.getElementById('voiceLoadingWarning');
        if (voiceWarning) {
            voiceWarning.classList.add('hidden');
        }
    }
    
    // Check if voices are ready before allowing game access
    function checkVoicesReadyForGame() {
        if (!isVoicesLoadedInSession() && !voicesLoaded) {
            showVoiceLoadingWarning();
            ensureVoicesLoaded().then(() => {
                console.log('🎙️ Voices ready for game access');
            });
            return false;
        }
        return true;
    }
    
    async function speakText(text, lang = 'en-GB') {
        if (!('speechSynthesis' in window) || !text) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Ensure voices are loaded
        await ensureVoicesLoaded();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Normalize language code
        let normalizedLang = lang;
        if (lang === 'es-US' || lang === 'es-ES') {
            normalizedLang = 'es-ES'; // Prefer Spanish from Spain for better quality
        } else if (lang === 'en-US' || lang === 'en-GB') {
            normalizedLang = 'en-GB'; // Prefer British English for better quality
        }
        
        utterance.lang = normalizedLang;
        
        // Use selected high-quality voice if available
        const selectedVoice = selectedVoices[normalizedLang];
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`🎙️ Using selected voice for ${normalizedLang}: ${selectedVoice.name}`);
        } else {
            console.log(`🎙️ No selected voice for ${normalizedLang}, using default`);
        }
        
        // Optimize speech parameters
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Additional fine-tuning for specific languages
        if (normalizedLang.startsWith('es')) {
            utterance.rate = 0.8; // Slightly slower for Spanish
        } else if (normalizedLang.startsWith('en')) {
            utterance.rate = 0.9; // Natural pace for English
        }
        
        console.log(`🗣️ Speaking "${text}" in ${normalizedLang}`);
        window.speechSynthesis.speak(utterance);
    }
    
    function closeNotesManagement() {
        const notesManagementModal = document.getElementById('notesManagementModal');
        if (notesManagementModal) {
            notesManagementModal.classList.add('hidden');
        }
    }

    // --- UI & NAVIGATION ---
    function hideAllGames() { [matchingGameContainer, memoryTestGameContainer, multipleChoiceGameContainer, typeTranslationGameContainer, talkToMeGameContainer, fillInTheBlanksGameContainer, findTheWordsGameContainer, gameOverMessage, roundCompleteMessageDiv, bonusRoundCountdownMessageDiv].forEach(el => el.classList.add('hidden')); }
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
        // Ensure voices are loaded before starting game
        ensureVoicesLoaded().then(() => {
            if (!audioInitialized) initializeAudio();
            partSelectionContainer.classList.add('hidden');
            resetGameStats();
            switch (gameType) {
                case 'matching': initMatchingGame(); break;
                case 'memoryTest': initMemoryTestGame(); break;
                case 'multipleChoice': initMultipleChoiceGame(); break;
                case 'typeTranslation': initTypeTranslationGame(); break;
                case 'talkToMe': initTalkToMeGame(); break;
                case 'fillInTheBlanks': initFillInTheBlanksGame(); break;
                case 'findTheWords': initFindTheWordsGame(); break;
            }
        });
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
                    recognition.lang = 'en'; // Use generic English to be less accent-sensitive
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
            
            // Helper function for calculating edit distance (Levenshtein distance)
            function getEditDistance(str1, str2) {
                const matrix = [];
                const n = str1.length;
                const m = str2.length;
                
                if (n === 0) return m;
                if (m === 0) return n;
                
                // Initialize matrix
                for (let i = 0; i <= n; i++) {
                    matrix[i] = [i];
                }
                for (let j = 0; j <= m; j++) {
                    matrix[0][j] = j;
                }
                
                // Fill in the matrix
                for (let i = 1; i <= n; i++) {
                    for (let j = 1; j <= m; j++) {
                        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                            matrix[i][j] = matrix[i - 1][j - 1];
                        } else {
                            matrix[i][j] = Math.min(
                                matrix[i - 1][j - 1] + 1, // substitution
                                matrix[i][j - 1] + 1,     // insertion
                                matrix[i - 1][j] + 1      // deletion
                            );
                        }
                    }
                }
                
                return matrix[n][m];
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
                        
                        // Update progress for spaced repetition
                        const item = currentVocab[card1Id] || currentVocab[card2Id];
                        if (item) {
                            updateNoteProgress(item.lang1, item.lang2, true);
                        }
                        
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
                                // Update progress for incorrect match
                                updateNoteProgress(currentVocab[card1Id].lang1, currentVocab[card1Id].lang2, false);
                            }
                            if (currentVocab[card2Id] && !gameState.wrongMatches.find(w => w.lang1 === currentVocab[card2Id].lang1)) {
                                gameState.wrongMatches.push(currentVocab[card2Id]);
                                // Update progress for incorrect match
                                updateNoteProgress(currentVocab[card2Id].lang1, currentVocab[card2Id].lang2, false);
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

            function initMemoryTestGame() {
                // Initialize the Memory Test game state
                if (!window.memoryTestGameState) {
                    window.memoryTestGameState = {
                        currentRound: 1,
                        totalRounds: 3,
                        cardsPerRound: [4, 6, 8], // Cards for each round
                        lives: 3,
                        wrongCards: [],
                        bonusRoundActive: false,
                        currentCard: null,
                        recordingTimeoutId: null,
                        cardAttempts: {}, // Track attempts per card ID
                        roundCompletedCards: [] // Track completed cards for current round
                    };
                }
                
                startMemoryTestRound();
            }
            
            function startMemoryTestRound() {
                const gameState = window.memoryTestGameState;
                let gameVocab;
                
                if (gameState.bonusRoundActive) {
                    gameVocab = gameState.wrongCards;
                    memoryTestFeedback.textContent = `Bonus Round - Let's try those again!`;
                    memoryTestRoundInfo.textContent = `Bonus Round`;
                } else {
                    const cardsThisRound = gameState.cardsPerRound[gameState.currentRound - 1];
                    gameVocab = shuffleArray(currentVocabularyPart).slice(0, cardsThisRound);
                    memoryTestFeedback.textContent = `Round ${gameState.currentRound} of ${gameState.totalRounds}`;
                    memoryTestRoundInfo.textContent = `Round ${gameState.currentRound}/${gameState.totalRounds}`;
                }
                
                // Reset round-specific state
                gameState.roundCompletedCards = [];
                gameState.cardAttempts = {};
                
                memoryTestGameContainer.classList.remove('hidden');
                memoryTestGrid.innerHTML = '';
                
                // Update lives display
                updateMemoryTestLives();
                
                // Hide timer initially
                memoryTestTimer.classList.add('hidden');
                
                // Only show language selector if no language is defined
                if (!hasDefinedLanguage()) {
                    languageSelectionInGameContainer.classList.remove('hidden');
                } else {
                    languageSelectionInGameContainer.classList.add('hidden');
                    activeTargetStudyLanguage = getCurrentActiveLanguage();
                }
                
                hearItOutLoudToggleBtn.classList.remove('hidden');
                
                // Create cards showing target language words
                gameVocab.forEach((item, index) => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'memory-test-card card p-3';
                    cardElement.textContent = item.lang2; // Show target language (user needs to say lang1)
                    cardElement.dataset.id = index;
                    cardElement.dataset.lang1 = item.lang1; // Expected answer
                    cardElement.dataset.lang2 = item.lang2;
                    cardElement.addEventListener('click', () => handleMemoryTestCardClick(cardElement));
                    memoryTestGrid.appendChild(cardElement);
                });
            }
            
            function updateMemoryTestLives() {
                const gameState = window.memoryTestGameState;
                const livesContainer = memoryTestLives;
                livesContainer.innerHTML = '';
                
                for (let i = 0; i < gameState.lives; i++) {
                    const life = document.createElement('span');
                    life.className = 'text-2xl';
                    life.textContent = '🦫';
                    livesContainer.appendChild(life);
                }
            }
            
            function handleMemoryTestCardClick(cardElement) {
                const gameState = window.memoryTestGameState;
                
                // Don't allow clicking if already completed or recording
                if (cardElement.classList.contains('completed') || 
                    cardElement.classList.contains('recording') || 
                    gameState.currentCard) {
                    return;
                }
                
                // Initialize attempts tracking for this card
                const cardId = cardElement.dataset.id;
                if (!gameState.cardAttempts[cardId]) {
                    gameState.cardAttempts[cardId] = 0;
                }
                
                // Check if this card has already been attempted 3 times
                if (gameState.cardAttempts[cardId] >= 3) {
                    return;
                }
                
                gameState.currentCard = cardElement;
                cardElement.classList.add('recording');
                
                // Show recording UI
                memoryTestRecording.classList.remove('hidden');
                memoryTestRecognizedText.textContent = '';
                memoryTestHint.classList.add('hidden'); // Hide hint for new card
                
                // Start timer
                startMemoryTestTimer();
                
                // Start speech recognition
                startMemoryTestListening(cardElement);
            }
            
            function startMemoryTestTimer() {
                const gameState = window.memoryTestGameState;
                memoryTestTimer.classList.remove('hidden');
                let timeLeft = 5;
                memoryTestTimerValue.textContent = timeLeft;
                
                const timerInterval = setInterval(() => {
                    timeLeft--;
                    memoryTestTimerValue.textContent = timeLeft;
                    
                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        memoryTestTimer.classList.add('hidden');
                        
                        // Time's up - treat as incorrect if still recording
                        if (gameState.currentCard && gameState.currentCard.classList.contains('recording')) {
                            handleMemoryTestIncorrect(gameState.currentCard, 'Time\'s up!');
                        }
                    }
                }, 1000);
                
                // Store timer for potential cleanup
                gameState.recordingTimeoutId = timerInterval;
            }
            
            function startMemoryTestListening(cardElement) {
                if (!recognition) {
                    // Try to initialize if not already done
                    initSpeechRecognition();
                    if (!recognition) {
                        memoryTestFeedback.textContent = "Speech recognition not available in this browser";
                        handleMemoryTestIncorrect(cardElement, 'Speech recognition not available');
                        return;
                    }
                }
                
                // Set recognition language to be more flexible with accents
                let recognitionLang = cardElement.dataset.termLang || activeTargetStudyLanguage;
                
                // Use more flexible language variants for recognition to accommodate different accents
                if (recognitionLang.startsWith('en')) {
                    recognition.lang = 'en'; // Generic English to accept all English accents
                } else if (recognitionLang.startsWith('es')) {
                    recognition.lang = 'es'; // Generic Spanish to accept all Spanish accents
                } else {
                    recognition.lang = recognitionLang.split('-')[0]; // Use generic language code
                }
                
                // Configure recognition for better accuracy
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.maxAlternatives = 3;
                
                console.log('🎙️ Memory Test: Using recognition language:', recognition.lang, 'for expected word:', cardElement.dataset.lang1);
                
                recognition.onresult = (event) => {
                    const spokenText = event.results[0][0].transcript.toLowerCase().trim();
                    const expectedAnswer = cardElement.dataset.lang1.toLowerCase().trim();
                    
                    console.log('🎙️ Memory Test Recognition:', { 
                        spoken: spokenText, 
                        expected: expectedAnswer,
                        confidence: event.results[0][0].confidence 
                    });
                    
                    // Display both texts for debugging
                    memoryTestRecognizedText.textContent = `Heard: "${spokenText}" | Expected: "${expectedAnswer}"`;
                    
                    // Normalize both texts: remove punctuation, extra spaces, and common variations
                    const normalizeText = (text) => {
                        return text.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
                    };
                    
                    const normalizedSpoken = normalizeText(spokenText);
                    const normalizedExpected = normalizeText(expectedAnswer);
                    
                    console.log('🔍 Memory Test Normalized:', { 
                        spoken: normalizedSpoken, 
                        expected: normalizedExpected 
                    });
                    
                    // Multiple matching strategies for better accuracy
                    const exactMatch = normalizedSpoken === normalizedExpected;
                    const containsMatch = normalizedSpoken.includes(normalizedExpected) || normalizedExpected.includes(normalizedSpoken);
                    const editDistanceMatch = getEditDistance(normalizedSpoken, normalizedExpected) <= Math.max(1, Math.floor(normalizedExpected.length * 0.3));
                    
                    const isCorrect = exactMatch || containsMatch || editDistanceMatch;
                    
                    console.log('🎯 Memory Test Matching:', { 
                        exactMatch, 
                        containsMatch, 
                        editDistanceMatch, 
                        finalResult: isCorrect 
                    });
                    
                    if (isCorrect) {
                        handleMemoryTestCorrect(cardElement);
                    } else {
                        // Show "They matched correctly" button if the texts look similar
                        const similarity = 1 - (getEditDistance(normalizedSpoken, normalizedExpected) / Math.max(normalizedSpoken.length, normalizedExpected.length));
                        if (similarity > 0.7) {
                            showMemoryTestMatchButton(cardElement, spokenText, expectedAnswer);
                        } else {
                            handleMemoryTestIncorrect(cardElement, `Expected: "${expectedAnswer}"`);
                        }
                    }
                };
                
                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    handleMemoryTestIncorrect(cardElement, 'Speech recognition error');
                };
                
                recognition.onend = () => {
                    // Recognition ended - cleanup if still recording
                    if (cardElement.classList.contains('recording')) {
                        stopMemoryTestRecording(cardElement);
                    }
                };
                
                try {
                    recognition.start();
                } catch (error) {
                    console.error('Could not start speech recognition:', error);
                    handleMemoryTestIncorrect(cardElement, 'Could not start recording');
                }
            }
            
            function showMemoryTestMatchButton(cardElement, spokenText, expectedAnswer) {
                const gameState = window.memoryTestGameState;
                
                // Create a "They matched correctly" button
                const matchButtonContainer = document.createElement('div');
                matchButtonContainer.id = 'memoryTestMatchContainer';
                matchButtonContainer.className = 'bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3 text-center';
                matchButtonContainer.innerHTML = `
                    <p class="text-sm text-yellow-800 mb-2">
                        Heard: "<strong>${spokenText}</strong>" | Expected: "<strong>${expectedAnswer}</strong>"
                    </p>
                    <p class="text-xs text-yellow-700 mb-3">Do these match? Sometimes pronunciation differences aren't detected correctly.</p>
                    <div class="flex gap-2 justify-center">
                        <button id="memoryTestConfirmMatch" class="btn btn-primary text-sm py-1 px-3">✅ They Match Correctly</button>
                        <button id="memoryTestRejectMatch" class="btn btn-secondary text-sm py-1 px-3">❌ They Don't Match</button>
                    </div>
                `;
                
                // Insert after recognition area
                const recognitionArea = document.getElementById('memoryTestRecording');
                recognitionArea.parentNode.insertBefore(matchButtonContainer, recognitionArea.nextSibling);
                
                // Add event listeners
                document.getElementById('memoryTestConfirmMatch').addEventListener('click', () => {
                    console.log('🎯 Memory Test: User confirmed match');
                    matchButtonContainer.remove();
                    handleMemoryTestCorrect(cardElement);
                });
                
                document.getElementById('memoryTestRejectMatch').addEventListener('click', () => {
                    console.log('🎯 Memory Test: User rejected match');
                    matchButtonContainer.remove();
                    handleMemoryTestIncorrect(cardElement, `Expected: "${expectedAnswer}"`);
                });
                
                // Auto-remove after 10 seconds
                setTimeout(() => {
                    if (document.getElementById('memoryTestMatchContainer')) {
                        matchButtonContainer.remove();
                        handleMemoryTestIncorrect(cardElement, `Expected: "${expectedAnswer}"`);
                    }
                }, 10000);
            }
            
            function handleMemoryTestCorrect(cardElement) {
                const gameState = window.memoryTestGameState;
                const cardId = cardElement.dataset.id;
                
                stopMemoryTestRecording(cardElement);
                
                cardElement.classList.remove('recording');
                cardElement.classList.add('correct', 'completed');
                
                // Calculate points based on time and attempts
                const attempts = gameState.cardAttempts[cardId] + 1;
                const timeLeft = parseInt(memoryTestTimerValue.textContent) || 0;
                let points = 0;
                
                if (attempts === 1 && timeLeft > 0) {
                    points = 10; // First try within 5 seconds
                } else if (attempts === 2) {
                    points = 5; // Second try
                }
                
                // Update score
                currentScore += points;
                if (currentScore > sessionMaxScore) {
                    sessionMaxScore = currentScore;
                }
                updateScoreDisplay();
                
                // Play success sound
                playCorrectMatchSound();
                
                // Update progress for correct answer
                const vocabItem = {
                    lang1: cardElement.dataset.lang1,
                    lang2: cardElement.dataset.lang2
                };
                updateNoteProgress(vocabItem.lang1, vocabItem.lang2, true);
                
                memoryTestFeedback.textContent = `Correct! +${points} points`;
                gameState.roundCompletedCards.push(cardId);
                
                // Check if round is complete
                setTimeout(() => {
                    checkMemoryTestRoundComplete();
                }, 1500);
            }
            
            function handleMemoryTestIncorrect(cardElement, message) {
                const gameState = window.memoryTestGameState;
                const cardId = cardElement.dataset.id;
                
                stopMemoryTestRecording(cardElement);
                
                cardElement.classList.remove('recording');
                cardElement.classList.add('incorrect');
                
                gameState.cardAttempts[cardId]++;
                
                // Remove incorrect class after animation
                setTimeout(() => {
                    cardElement.classList.remove('incorrect');
                }, 500);
                
                memoryTestFeedback.textContent = message;
                
                // Check if this was the second attempt
                if (gameState.cardAttempts[cardId] >= 2) {
                    cardElement.classList.add('completed');
                    
                    // Add to wrong cards for bonus round
                    const vocabItem = {
                        lang1: cardElement.dataset.lang1,
                        lang2: cardElement.dataset.lang2
                    };
                    
                    if (!gameState.wrongCards.find(w => w.lang1 === vocabItem.lang1)) {
                        gameState.wrongCards.push(vocabItem);
                    }
                    
                    // Update progress for incorrect answer
                    updateNoteProgress(vocabItem.lang1, vocabItem.lang2, false);
                    
                    gameState.roundCompletedCards.push(cardId);
                    
                    // Lose a life
                    gameState.lives--;
                    updateMemoryTestLives();
                    
                    if (gameState.lives <= 0) {
                        endMemoryTestGame('Game Over! No lives remaining.');
                        return;
                    }
                }
                
                // Check if round is complete
                setTimeout(() => {
                    checkMemoryTestRoundComplete();
                }, 1500);
            }
            
            function stopMemoryTestRecording(cardElement) {
                const gameState = window.memoryTestGameState;
                
                // Hide recording UI
                memoryTestRecording.classList.add('hidden');
                memoryTestTimer.classList.add('hidden');
                
                // Clear timer
                if (gameState.recordingTimeoutId) {
                    clearInterval(gameState.recordingTimeoutId);
                    gameState.recordingTimeoutId = null;
                }
                
                // Stop speech recognition
                if (recognition && recognition.isListening !== false) {
                    try {
                        recognition.stop();
                    } catch (error) {
                        console.log('Error stopping recognition:', error);
                    }
                }
                
                gameState.currentCard = null;
            }
            
            function checkMemoryTestRoundComplete() {
                const gameState = window.memoryTestGameState;
                const totalCardsThisRound = gameState.bonusRoundActive ? 
                    gameState.wrongCards.length : 
                    gameState.cardsPerRound[gameState.currentRound - 1];
                
                if (gameState.roundCompletedCards.length >= totalCardsThisRound) {
                    if (gameState.bonusRoundActive) {
                        endMemoryTestGame('Bonus Round Complete! Well done!');
                    } else if (gameState.currentRound < gameState.totalRounds) {
                        gameState.currentRound++;
                        memoryTestFeedback.textContent = `Round ${gameState.currentRound - 1} Complete! Get ready for Round ${gameState.currentRound}...`;
                        
                        setTimeout(() => {
                            startMemoryTestRound();
                        }, 2000);
                    } else {
                        // All regular rounds complete
                        if (gameState.wrongCards.length > 0) {
                            gameState.bonusRoundActive = true;
                            memoryTestFeedback.textContent = "All rounds complete! Starting bonus round...";
                            
                            setTimeout(() => {
                                startMemoryTestRound();
                            }, 2000);
                        } else {
                            endMemoryTestGame('Perfect game! All rounds completed flawlessly!');
                        }
                    }
                }
            }
            
            function endMemoryTestGame(message) {
                memoryTestFeedback.textContent = message;
                
                // Reset game state
                window.memoryTestGameState = null;
                
                // Show game complete message
                setTimeout(() => {
                    gameOverMessage.classList.remove('hidden');
                    memoryTestGameContainer.classList.add('hidden');
                }, 2000);
            }
            
            function showMemoryTestHint(cardElement) {
                const expectedAnswer = cardElement.dataset.lang1;
                if (expectedAnswer.length < 3) {
                    memoryTestHint.textContent = `Hint: "${expectedAnswer}"`;
                } else {
                    const firstLetter = expectedAnswer.charAt(0);
                    const lastTwoLetters = expectedAnswer.slice(-2);
                    const middleAsterisks = '*'.repeat(Math.max(0, expectedAnswer.length - 3));
                    memoryTestHint.textContent = `Hint: ${firstLetter}${middleAsterisks}${lastTwoLetters}`;
                }
                memoryTestHint.classList.remove('hidden');
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
                    
                    // Update progress for correct answer
                    updateNoteProgress(item.lang1, item.lang2, true);
                    
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
                    
                    // Update progress for incorrect answer
                    updateNoteProgress(item.lang1, item.lang2, false);
                    
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
                
                // Initialize wrong answers tracking for Talk to Me
                if (!window.talkToMeWrongAnswers) {
                    window.talkToMeWrongAnswers = [];
                }
                if (!window.talkToMeAttempts) {
                    window.talkToMeAttempts = {}; // Track attempts per question
                }
                window.talkToMeBonusRoundActive = false;
                
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
                    // Check if we need a bonus round for wrong answers
                    if (window.talkToMeWrongAnswers && window.talkToMeWrongAnswers.length > 0 && !window.talkToMeBonusRoundActive) {
                        window.talkToMeBonusRoundActive = true;
                        talkToMeFeedback.textContent = "Starting bonus round for missed words...";
                        
                        setTimeout(() => {
                            // Reset index and use wrong answers for bonus round
                            currentTalkToMeIndex = 0;
                            displayNextTalkToMe(window.talkToMeWrongAnswers);
                        }, 2000);
                        return;
                    } else {
                        talkToMePhraseText.textContent = window.talkToMeBonusRoundActive ? "Bonus Round Complete!" : "Part Complete!";
                        return;
                    }
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
                
                // Set recognition language but make it more flexible for accents
                let recognitionLang = activeTargetStudyLanguage;
                
                // For speech recognition, be more flexible with language variants
                // to accommodate different accents
                if (recognitionLang.startsWith('en')) {
                    recognitionLang = 'en-US'; // Use US English for recognition (more broadly supported)
                } else if (recognitionLang.startsWith('es')) {
                    recognitionLang = 'es-US'; // Use US Spanish for recognition (more broadly supported)
                }
                
                console.log('🎙️ Starting speech recognition with language:', recognitionLang);
                recognition.lang = recognitionLang;
                
                // Make recognition more permissive
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.maxAlternatives = 3; // Get multiple alternatives for better matching
                
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
                
                // Initialize attempts tracking for this question
                const questionKey = `${currentTalkToMeIndex}_${item.lang1}`;
                if (!window.talkToMeAttempts[questionKey]) {
                    window.talkToMeAttempts[questionKey] = 0;
                }
                window.talkToMeAttempts[questionKey]++;
                
                console.log('🎙️ Talk to Me Recognition:', { 
                    spoken: spokenText, 
                    expected: item.lang1,
                    attempt: window.talkToMeAttempts[questionKey]
                });
                
                // Display what was heard with both texts
                talkToMeRecognizedText.textContent = `Heard: "${spokenText}" | Expected: "${item.lang1}"`;
                
                // Enhanced matching logic (same as Memory Test)
                const normalizeTextAdvanced = (text) => {
                    return text.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
                };
                
                const normalizedSpoken = normalizeTextAdvanced(spokenText.toLowerCase());
                const normalizedExpected = normalizeTextAdvanced(item.lang1.toLowerCase());
                
                console.log('🔍 Talk to Me Normalized:', { 
                    spoken: normalizedSpoken, 
                    expected: normalizedExpected 
                });
                
                // Multiple matching strategies for better accuracy
                const exactMatch = normalizedSpoken === normalizedExpected;
                const containsMatch = normalizedSpoken.includes(normalizedExpected) || normalizedExpected.includes(normalizedSpoken);
                const editDistanceMatch = getEditDistance(normalizedSpoken, normalizedExpected) <= Math.max(1, Math.floor(normalizedExpected.length * 0.3));
                
                const isCorrect = exactMatch || containsMatch || editDistanceMatch;
                
                console.log('🎯 Talk to Me Matching:', { 
                    exactMatch, 
                    containsMatch, 
                    editDistanceMatch, 
                    finalResult: isCorrect 
                });

                if (isCorrect) {
                    talkToMeFeedback.textContent = "Correct! Well done!";
                    talkToMeFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-green-600";
                    playCorrectMatchSound();
                    
                    // Update progress for correct answer
                    updateNoteProgress(item.lang1, item.lang2, true);

                    // Auto-advance after a short delay
                    setTimeout(() => {
                        currentTalkToMeIndex++;
                        displayNextTalkToMe(currentVocabularyPart);
                    }, 1500);
                } else {
                    const attempts = window.talkToMeAttempts[questionKey];
                    
                    if (attempts >= 3) {
                        // Add to wrong answers if max attempts reached
                        if (!window.talkToMeWrongAnswers.some(wrong => wrong.lang1 === item.lang1)) {
                            window.talkToMeWrongAnswers.push(item);
                        }
                        
                        // Update progress for incorrect answer (max attempts reached)
                        updateNoteProgress(item.lang1, item.lang2, false);
                        
                        talkToMeFeedback.textContent = `Expected: "${item.lang1}". Moving to next question.`;
                        talkToMeFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-red-600";
                        playIncorrectSound();
                        
                        // Auto-advance after showing the correct answer
                        setTimeout(() => {
                            currentTalkToMeIndex++;
                            displayNextTalkToMe(currentVocabularyPart);
                        }, 2500);
                    } else {
                        // Show "They matched correctly" button if texts are similar
                        const similarity = 1 - (getEditDistance(normalizedSpoken, normalizedExpected) / Math.max(normalizedSpoken.length, normalizedExpected.length));
                        if (similarity > 0.7) {
                            showTalkToMeMatchButton(spokenText, item.lang1, item);
                        } else {
                            talkToMeFeedback.textContent = `Try ${attempts}/3: Expected "${item.lang1}". Try again or click the word to hear it.`;
                            talkToMeFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-orange-600";
                            playIncorrectSound();
                            
                            // Allow another attempt
                            nextTalkToMeBtn.classList.remove('hidden');
                        }
                    }
                }
            }

            function showTalkToMeMatchButton(spokenText, expectedText, item) {
                // Create a "They matched correctly" button
                const matchButtonContainer = document.createElement('div');
                matchButtonContainer.id = 'talkToMeMatchContainer';
                matchButtonContainer.className = 'bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3 text-center';
                matchButtonContainer.innerHTML = `
                    <p class="text-sm text-yellow-800 mb-2">
                        Heard: "<strong>${spokenText}</strong>" | Expected: "<strong>${expectedText}</strong>"
                    </p>
                    <p class="text-xs text-yellow-700 mb-3">Do these match? Sometimes pronunciation differences aren't detected correctly.</p>
                    <div class="flex gap-2 justify-center">
                        <button id="talkToMeConfirmMatch" class="btn btn-primary text-sm py-1 px-3">✅ They Match Correctly</button>
                        <button id="talkToMeRejectMatch" class="btn btn-secondary text-sm py-1 px-3">❌ They Don't Match</button>
                    </div>
                `;
                
                // Insert after feedback area
                const feedbackArea = document.getElementById('talkToMeFeedback');
                feedbackArea.parentNode.insertBefore(matchButtonContainer, feedbackArea.nextSibling);
                
                // Add event listeners
                document.getElementById('talkToMeConfirmMatch').addEventListener('click', () => {
                    console.log('🎯 Talk to Me: User confirmed match');
                    matchButtonContainer.remove();
                    
                    talkToMeFeedback.textContent = "Correct! Well done!";
                    talkToMeFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-green-600";
                    playCorrectMatchSound();
                    
                    // Update progress for manually confirmed correct answer
                    updateNoteProgress(item.lang1, item.lang2, true);

                    // Auto-advance after a short delay
                    setTimeout(() => {
                        currentTalkToMeIndex++;
                        displayNextTalkToMe(currentVocabularyPart);
                    }, 1500);
                });
                
                document.getElementById('talkToMeRejectMatch').addEventListener('click', () => {
                    console.log('🎯 Talk to Me: User rejected match');
                    matchButtonContainer.remove();
                    
                    const questionKey = `${currentTalkToMeIndex}_${item.lang1}`;
                    const attempts = window.talkToMeAttempts[questionKey];
                    
                    talkToMeFeedback.textContent = `Try ${attempts}/3: Expected "${item.lang1}". Try again or click the word to hear it.`;
                    talkToMeFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-orange-600";
                    playIncorrectSound();
                    
                    // Allow another attempt
                    nextTalkToMeBtn.classList.remove('hidden');
                });
                
                // Auto-remove after 10 seconds
                setTimeout(() => {
                    if (document.getElementById('talkToMeMatchContainer')) {
                        matchButtonContainer.remove();
                        const questionKey = `${currentTalkToMeIndex}_${item.lang1}`;
                        const attempts = window.talkToMeAttempts[questionKey];
                        
                        talkToMeFeedback.textContent = `Try ${attempts}/3: Expected "${item.lang1}". Try again or click the word to hear it.`;
                        talkToMeFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-orange-600";
                        nextTalkToMeBtn.classList.remove('hidden');
                    }
                }, 10000);
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
                const allCorrect = correctCount === WORDS_PER_FIND_WORDS_TARGET && findWordsSelectedWords.length === WORDS_PER_FIND_WORDS_TARGET;
                
                if (allCorrect) {
                    playCorrectMatchSound();
                    currentScore += 10; // Bonus points for finding all 3 words correctly
                    if (currentScore > sessionMaxScore) {
                        sessionMaxScore = currentScore;
                    }
                    updateScoreDisplay();
                    
                    // Update progress for all correct words found
                    findWordsTargetWords.forEach(word => {
                        const vocabItem = findWordsSessionPool.find(item => 
                            item.lang1.toLowerCase() === word.toLowerCase() || 
                            item.lang2.toLowerCase() === word.toLowerCase()
                        );
                        if (vocabItem) {
                            updateNoteProgress(vocabItem.lang1, vocabItem.lang2, true);
                        }
                    });
                    
                    findTheWordsFeedback.textContent = `Perfect! You found all ${correctCount} words!`;
                    findTheWordsFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-green-600";
                    
                    // Auto-advance to next round after 2 seconds
                    setTimeout(() => {
                        findWordsSelectedWords = [];
                        startFindTheWordsRound(findWordsSessionPool);
                        findTheWordsFeedback.textContent = '';
                        findTheWordsFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base";
                        nextFindTheWordsRoundBtn.classList.add('hidden');
                    }, 2000);
                } else {
                    playIncorrectSound();
                    
                    // Update progress for incorrect words (missed targets)
                    findWordsTargetWords.forEach(word => {
                        if (!findWordsSelectedWords.includes(word)) {
                            const vocabItem = findWordsSessionPool.find(item => 
                                item.lang1.toLowerCase() === word.toLowerCase() || 
                                item.lang2.toLowerCase() === word.toLowerCase()
                            );
                            if (vocabItem) {
                                updateNoteProgress(vocabItem.lang1, vocabItem.lang2, false);
                            }
                        }
                    });
                    
                    findTheWordsFeedback.textContent = `You found ${correctCount} of ${findWordsTargetWords.length} correct words.`;
                    findTheWordsFeedback.className = "text-center font-medium mt-2 sm:mt-3 h-5 sm:h-6 text-sm sm:text-base text-orange-600";
                    nextFindTheWordsRoundBtn.classList.remove('hidden');
                }
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
            translateTextBtn.addEventListener('click', handleLiveNotesTranslation);
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
            
            // Fill Up translations button
            const notesFillUpBtn = document.getElementById('notesFillUpBtn');
            if (notesFillUpBtn) {
                notesFillUpBtn.addEventListener('click', handleFillUpTranslations);
            }
            showUploadSectionBtn.addEventListener('click', () => { mainSelectionSection.classList.add('hidden'); uploadSection.classList.remove('hidden'); });
            backToMainSelectionFromUploadBtn.addEventListener('click', showMainSelection);
            showEssentialsSectionBtn.addEventListener('click', () => { mainSelectionSection.classList.add('hidden'); essentialsCategorySelectionSection.classList.remove('hidden'); isEssentialsMode = true; populateEssentialsCategoryButtons(); });
            backToMainSelectionFromEssentialsBtn.addEventListener('click', showMainSelection);
            backToEssentialsCategoriesBtn.addEventListener('click', () => { essentialsCategoryOptionsSection.classList.add('hidden'); essentialsCategorySelectionSection.classList.remove('hidden'); });
            reviewEssentialsCategoryBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                essentialsCategoryOptionsSection.classList.add('hidden'); 
                gameArea.classList.remove('hidden'); 
                ensureVoicesLoaded().then(() => startGame('matching')); 
            });
            playGamesWithEssentialsBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                essentialsCategoryOptionsSection.classList.add('hidden'); 
                ensureVoicesLoaded().then(() => showGameSelection()); 
            });
            backToGameSelectionBtn.addEventListener('click', showGameSelection);
            backToSourceSelectionBtn.addEventListener('click', () => { gameSelectionSection.classList.add('hidden'); if (isEssentialsMode) { essentialsCategoryOptionsSection.classList.remove('hidden'); } else { showMainSelection(); } });
            matchingBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                ensureVoicesLoaded().then(() => showPartSelection('matching')); 
            });
            memoryTestBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                ensureVoicesLoaded().then(() => showPartSelection('memoryTest')); 
            });
            multipleChoiceBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                ensureVoicesLoaded().then(() => showPartSelection('multipleChoice')); 
            });
            typeTranslationBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                ensureVoicesLoaded().then(() => showPartSelection('typeTranslation')); 
            });
            talkToMeBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                ensureVoicesLoaded().then(() => showPartSelection('talkToMe')); 
            });
            fillInTheBlanksBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                ensureVoicesLoaded().then(() => showPartSelection('fillInTheBlanks')); 
            });
            findTheWordsBtn.addEventListener('click', () => { 
                if (!checkVoicesReadyForGame()) return;
                initializeAudio(); 
                ensureVoicesLoaded().then(() => showPartSelection('findTheWords')); 
            });
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
            if (resetMemoryTestBtn) resetMemoryTestBtn.addEventListener('click', () => {
                // Reset the current memory test round
                if (window.memoryTestGameState) {
                    window.memoryTestGameState.roundCompletedCards = [];
                    window.memoryTestGameState.cardAttempts = {};
                    startMemoryTestRound();
                }
            });
            
            if (memoryTestHintBtn) memoryTestHintBtn.addEventListener('click', () => {
                const gameState = window.memoryTestGameState;
                if (gameState.currentCard) {
                    showMemoryTestHint(gameState.currentCard);
                }
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
                        
                        // Force correct accents and override device defaults
                        let targetLang = lang || activeTargetStudyLanguage || 'en-GB';
                        
                        // Force specific accents as requested
                        if (targetLang.startsWith('en')) {
                            targetLang = 'en-GB'; // Always use UK English
                        } else if (targetLang.startsWith('es')) {
                            targetLang = 'es-ES'; // Always use Spain Spanish
                        }
                        
                        utterance.lang = targetLang;
                        
                        // Wait for voices to load
                        let voicesLoaded = false;
                        const loadVoices = () => {
                            if (voicesLoaded) return;
                            voicesLoaded = true;
                            
                            const voices = window.speechSynthesis.getVoices();
                            console.log('🔊 Available voices:', voices.map(v => ({ name: v.name, lang: v.lang, localService: v.localService })));
                            
                            let selectedVoice = null;
                            
                            if (targetLang.startsWith('en')) {
                                // Prioritize UK English voices
                                selectedVoice = voices.find(voice => 
                                    voice.lang.includes('en-GB') && voice.localService
                                ) || voices.find(voice => 
                                    voice.lang.includes('en-GB')
                                ) || voices.find(voice => 
                                    voice.lang.includes('en') && voice.name.toLowerCase().includes('british')
                                ) || voices.find(voice => 
                                    voice.lang.includes('en') && voice.name.toLowerCase().includes('uk')
                                );
                            } else if (targetLang.startsWith('es')) {
                                // Prioritize Spain Spanish voices
                                selectedVoice = voices.find(voice => 
                                    voice.lang.includes('es-ES') && voice.localService
                                ) || voices.find(voice => 
                                    voice.lang.includes('es-ES')
                                ) || voices.find(voice => 
                                    voice.lang.includes('es') && voice.name.toLowerCase().includes('spain')
                                ) || voices.find(voice => 
                                    voice.lang.includes('es') && !voice.name.toLowerCase().includes('mexico') && !voice.name.toLowerCase().includes('us')
                                );
                            } else {
                                // For other languages, try to find the most appropriate voice
                                selectedVoice = voices.find(voice => 
                                    voice.lang === targetLang && voice.localService
                                ) || voices.find(voice => 
                                    voice.lang === targetLang
                                ) || voices.find(voice => 
                                    voice.lang.startsWith(targetLang.split('-')[0])
                                );
                            }
                            
                            if (selectedVoice) {
                                utterance.voice = selectedVoice;
                                console.log('🔊 Selected voice:', selectedVoice.name, selectedVoice.lang);
                            } else {
                                console.log('🔊 No specific voice found, using default for:', targetLang);
                            }
                            
                            // Adjust speech settings for better clarity
                            utterance.rate = 0.8;
                            utterance.pitch = 1.0;
                            utterance.volume = 1.0;
                            
                            utterance.onend = resolve;
                            utterance.onerror = () => resolve();
                            window.speechSynthesis.speak(utterance);
                        };
                        
                        // Handle voices loading
                        if (window.speechSynthesis.getVoices().length > 0) {
                            loadVoices();
                        } else {
                            window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
                            // Fallback timeout
                            setTimeout(loadVoices, 1000);
                        }
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
                        
                        // Show hamburger menu when user is authenticated
                        const deckSidePanelToggle = document.getElementById('deckSidePanelToggle');
                        console.log('🍔 Attempting to show hamburger menu...', { deckSidePanelToggle: !!deckSidePanelToggle });
                        if (deckSidePanelToggle) {
                            deckSidePanelToggle.style.display = 'flex';
                            console.log('✅ Hamburger menu should now be visible');
                        } else {
                            console.error('❌ deckSidePanelToggle element not found!');
                        }

                        try {
                            // Initialize deck management first
                            console.log('🗂️ Initializing deck management...');
                            await initializeDeckManagement();
                            
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
                        
                        // Hide hamburger menu when user is not authenticated
                        const deckSidePanelToggle = document.getElementById('deckSidePanelToggle');
                        console.log('🍔 Hiding hamburger menu on logout...', { deckSidePanelToggle: !!deckSidePanelToggle });
                        if (deckSidePanelToggle) {
                            deckSidePanelToggle.style.display = 'none';
                        }
                        
                        // Also ensure side panel is closed when not authenticated
                        const deckSidePanel = document.getElementById('deckSidePanel');
                        if (deckSidePanel) {
                            deckSidePanel.classList.remove('open');
                        }
                        
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
                            
                            // Hide hamburger menu when no session
                            const deckSidePanelToggle = document.getElementById('deckSidePanelToggle');
                            console.log('🍔 Hiding hamburger menu (no session)...', { deckSidePanelToggle: !!deckSidePanelToggle });
                            if (deckSidePanelToggle) {
                                deckSidePanelToggle.style.display = 'none';
                            }
                            
                            // Also ensure side panel is closed when no session
                            const deckSidePanel = document.getElementById('deckSidePanel');
                            if (deckSidePanel) {
                                deckSidePanel.classList.remove('open');
                            }
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
                
                // Hide hamburger menu when Supabase not available
                const deckSidePanelToggle = document.getElementById('deckSidePanelToggle');
                console.log('🍔 Hiding hamburger menu (no Supabase)...', { deckSidePanelToggle: !!deckSidePanelToggle });
                if (deckSidePanelToggle) {
                    deckSidePanelToggle.style.display = 'none';
                }
                
                // Also ensure side panel is closed when not authenticated
                const deckSidePanel = document.getElementById('deckSidePanel');
                if (deckSidePanel) {
                    deckSidePanel.classList.remove('open');
                }
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

            // --- DECK MANAGEMENT EVENT LISTENERS ---
            
            // Side panel toggle
            const deckSidePanelToggle = document.getElementById('deckSidePanelToggle');
            if (deckSidePanelToggle) {
                deckSidePanelToggle.addEventListener('click', toggleDeckPanel);
            }
            
            // New deck button
            const newDeckBtn = document.getElementById('newDeckBtn');
            if (newDeckBtn) {
                newDeckBtn.addEventListener('click', showWelcomeModal);
            }
            
            // Welcome modal create deck button
            const createFirstDeckBtn = document.getElementById('createFirstDeckBtn');
            if (createFirstDeckBtn) {
                createFirstDeckBtn.addEventListener('click', async () => {
                    const deckName = document.getElementById('welcomeDeckName')?.value.trim();
                    const deckLanguage = document.getElementById('welcomeDeckLanguage')?.value;
                    const nativeLanguage = document.getElementById('welcomeNativeLanguage')?.value;
                    
                    if (!deckName) {
                        alert('Please enter a deck name.');
                        return;
                    }
                    
                    if (!nativeLanguage) {
                        alert('Please select your native language.');
                        return;
                    }
                    
                    if (!deckLanguage) {
                        alert('Please select the language you are learning.');
                        return;
                    }
                    
                    console.log('🆕 Creating first deck:', { deckName, deckLanguage, nativeLanguage });
                    
                    const newDeck = await createDeck(deckName, deckLanguage, nativeLanguage);
                    if (newDeck) {
                        // Store language preferences for dictionary API
                        localStorage.setItem('user_native_language', nativeLanguage);
                        localStorage.setItem('user_learning_language', deckLanguage);
                        
                        // Update state and UI
                        userDecks = await fetchUserDecks();
                        renderDecks(userDecks);
                        await selectDeck(newDeck.id, newDeck.name, newDeck.language);
                        
                        // Hide welcome modal
                        hideWelcomeModal();
                        
                        console.log('✅ First deck created and selected');
                    } else {
                        alert('Failed to create deck. Please try again.');
                    }
                });
            }
            
            // Close deck panel when clicking outside (mobile)
            document.addEventListener('click', (e) => {
                const panel = document.getElementById('deckSidePanel');
                const toggle = document.getElementById('deckSidePanelToggle');
                
                if (isPanelOpen && window.innerWidth <= 768) {
                    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
                        toggleDeckPanel();
                    }
                }
            });
            
            // Handle window resize
            window.addEventListener('resize', () => {
                const mainContent = document.getElementById('mainContent');
                if (window.innerWidth <= 768) {
                    mainContent.classList.remove('panel-open');
                } else if (isPanelOpen) {
                    mainContent.classList.add('panel-open');
                }
            });

            // Initialize voice loading early in the session
            console.log('🎙️ Starting voice initialization...');
            ensureVoicesLoaded().then(() => {
                console.log('🎙️ Voice initialization complete');
            });

        });
