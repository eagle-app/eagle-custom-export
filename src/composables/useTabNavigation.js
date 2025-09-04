import { ref, onMounted, onUnmounted } from 'vue';

export function useTabNavigation(containerRef) {
    const focusableElements = ref([]);
    const currentFocusIndex = ref(-1);

    // Define focusable selector
    const FOCUSABLE_SELECTOR = `
    button:not([disabled]):not([tabindex="-1"]),
    input:not([disabled]):not([tabindex="-1"]),
    select:not([disabled]):not([tabindex="-1"]),
    textarea:not([disabled]):not([tabindex="-1"]),
    [tabindex]:not([tabindex="-1"]):not([disabled])
  `.trim();

    // Get ordered focusable elements
    const getFocusableElements = () => {
        if (!containerRef.value) return [];
        const elements = Array.from(containerRef.value.querySelectorAll(FOCUSABLE_SELECTOR));
        // Sort by tabindex if specified, then DOM order
        // Ignore tabindex=0 in sorting (treat as default)
        return elements.sort((a, b) => {
            const aIndex = parseInt(a.getAttribute('tabindex') || '0');
            const bIndex = parseInt(b.getAttribute('tabindex') || '0');
            
            // Both have positive tabindex
            if (aIndex > 0 && bIndex > 0) {
                return aIndex - bIndex;
            }
            // Only a has positive tabindex - it comes first
            if (aIndex > 0) return -1;
            // Only b has positive tabindex - it comes first
            if (bIndex > 0) return 1;
            
            // Both have 0 or no tabindex - use DOM order
            return a.compareDocumentPosition(b) & 2 ? 1 : -1;
        });
    };

    // Update focusable elements when DOM changes
    const updateFocusableElements = () => {
        focusableElements.value = getFocusableElements();
    };

    // Handle Tab key
    const handleTabKey = (event) => {
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        event.preventDefault();
        event.stopPropagation();

        // Find current focused element index
        const activeElement = document.activeElement;
        let currentIndex = elements.findIndex(el => el === activeElement || el.contains(activeElement));

        // If no element is focused or focus is outside our container
        if (currentIndex === -1) {
            // For Tab, focus first element; for Shift+Tab, focus last element
            if (event.shiftKey) {
                currentIndex = elements.length - 1;
            } else {
                currentIndex = 0;
            }
            currentFocusIndex.value = currentIndex;
            elements[currentIndex]?.focus();
            return;
        }

        if (event.shiftKey) {
            // Shift+Tab: Move backwards
            currentIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
        } else {
            // Tab: Move forwards
            currentIndex = (currentIndex + 1) % elements.length;
        }

        currentFocusIndex.value = currentIndex;
        elements[currentIndex]?.focus();
    };

    // Focus the first element (lowest tabindex)
    const focusFirst = () => {
        const elements = getFocusableElements();
        if (elements.length > 0) {
            // Elements are already sorted by tabindex, so first element has lowest tabindex
            elements[0].focus();
            currentFocusIndex.value = 0;
        }
    };

    // Focus the last element
    const focusLast = () => {
        const elements = getFocusableElements();
        if (elements.length > 0) {
            elements[elements.length - 1].focus();
            currentFocusIndex.value = elements.length - 1;
        }
    };

    // Handle focus trap for dialogs
    const trapFocus = () => {
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        // If focus is outside the container, bring it back
        if (!containerRef.value?.contains(document.activeElement)) {
            firstElement?.focus();
        }
    };

    // Observer for DOM changes
    let observer = null;

    // Initialize on mount
    onMounted(() => {
        updateFocusableElements();

        // Set up mutation observer to watch for DOM changes
        if (containerRef.value) {
            observer = new MutationObserver(() => {
                updateFocusableElements();
            });

            observer.observe(containerRef.value, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled', 'tabindex']
            });
        }

        // Focus first element on mount (optional)
        // Uncomment if you want auto-focus on mount
        // focusFirst()
    });

    // Cleanup on unmount
    onUnmounted(() => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    });

    return {
        handleTabKey,
        getFocusableElements,
        updateFocusableElements,
        currentFocusIndex,
        focusableElements,
        focusFirst,
        focusLast,
        trapFocus
    };
}
