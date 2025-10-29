// Exam Security Service - Anti-cheating measures and full-screen functionality
export interface SecurityViolation {
  type: 'key_press' | 'tab_switch' | 'window_resize' | 'context_menu' | 'dev_tools';
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SecurityConfig {
  disableKeys: string[];
  preventTabSwitch: boolean;
  preventWindowResize: boolean;
  preventContextMenu: boolean;
  preventDevTools: boolean;
  logViolations: boolean;
  maxViolations: number;
}

export class ExamSecurityService {
  private violations: SecurityViolation[] = [];
  private isFullscreen = false;
  private isMonitoring = false;
  private config: SecurityConfig;
  private eventListeners: Array<{ event: string; handler: EventListener }> = [];
  private violationCallback?: (violation: SecurityViolation) => void;
  private autoStopTimer?: NodeJS.Timeout;
  private examDuration?: number; // in minutes

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      disableKeys: [
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        'Tab', 'Alt', 'Ctrl', 'Meta', 'Shift',
        'PrintScreen', 'ScrollLock', 'Pause',
        'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
        // Note: ESC is handled separately to prevent fullscreen exit
      ],
      preventTabSwitch: true,
      preventWindowResize: true,
      preventContextMenu: true,
      preventDevTools: true,
      logViolations: true,
      maxViolations: 10,
      ...config
    };
  }

  /**
   * Start monitoring for security violations with optional auto-stop
   */
  startMonitoring(callback?: (violation: SecurityViolation) => void, examDurationMinutes?: number): void {
    if (this.isMonitoring) {
      console.warn('Security monitoring is already active');
      return;
    }

    this.violationCallback = callback;
    this.isMonitoring = true;
    this.violations = [];
    this.examDuration = examDurationMinutes;

    console.log('🔒 Starting exam security monitoring...');
    
    // Set up auto-stop timer if exam duration is provided
    if (examDurationMinutes && examDurationMinutes > 0) {
      this.setupAutoStopTimer(examDurationMinutes);
    }

    // Disable keyboard shortcuts
    this.disableKeyboardShortcuts();
    
    // Add specific ESC key handler to prevent fullscreen exit
    this.preventEscKey();

    // Prevent context menu
    if (this.config.preventContextMenu) {
      this.preventContextMenu();
    }

    // Prevent tab switching
    if (this.config.preventTabSwitch) {
      this.preventTabSwitching();
    }

    // Prevent window resize
    if (this.config.preventWindowResize) {
      this.preventWindowResize();
    }

    // Monitor for dev tools
    if (this.config.preventDevTools) {
      this.monitorDevTools();
    }

    // Monitor visibility changes (tab switching)
    this.monitorVisibilityChange();

    console.log('✅ Security monitoring started successfully');
  }

  /**
   * Stop monitoring for security violations
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Security monitoring is not active');
      return;
    }

    console.log('🔒 Stopping exam security monitoring...');

    // Clear auto-stop timer
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = undefined;
    }

    // Remove all event listeners
    this.eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
      window.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // Re-enable context menu
    document.oncontextmenu = null;

    this.isMonitoring = false;
    this.violationCallback = undefined;
    this.examDuration = undefined;

    console.log('✅ Security monitoring stopped successfully');
  }

  /**
   * Enter fullscreen mode
   */
  async enterFullscreen(): Promise<boolean> {
    try {
      const element = document.documentElement;
      
      // Standard API (Chrome, Edge, Opera)
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } 
      // Firefox-specific API (mozRequestFullScreen with capital S)
      else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      }
      // Webkit API (Safari, older Chrome)
      else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      }
      // MS API (IE/Edge legacy)
      else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      else {
        console.warn('⚠️ Fullscreen API not supported in this browser');
        return false;
      }

      this.isFullscreen = true;
      console.log('✅ Entered fullscreen mode');
      return true;
    } catch (error) {
      console.error('❌ Failed to enter fullscreen:', error);
      // Don't log this as a violation - it's expected behavior when user denies permission
      console.warn('⚠️ Fullscreen permission denied or not supported');
      return false;
    }
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen(): Promise<boolean> {
    try {
      // Standard API
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
      // Firefox-specific API (mozCancelFullScreen with capital S)
      else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      }
      // Webkit API
      else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
      // MS API
      else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }

      this.isFullscreen = false;
      console.log('✅ Exited fullscreen mode');
      return true;
    } catch (error) {
      console.error('❌ Failed to exit fullscreen:', error);
      return false;
    }
  }

  /**
   * Check if currently in fullscreen
   */
  isInFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement
    );
  }

  /**
   * Get current violations
   */
  getViolations(): SecurityViolation[] {
    return [...this.violations];
  }

  /**
   * Get violation count
   */
  getViolationCount(): number {
    return this.violations.length;
  }

  /**
   * Check if max violations exceeded
   */
  hasExceededMaxViolations(): boolean {
    return this.violations.length >= this.config.maxViolations;
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Set up auto-stop timer for exam duration
   */
  private setupAutoStopTimer(durationMinutes: number): void {
    const durationMs = durationMinutes * 60 * 1000; // Convert to milliseconds
    
    this.autoStopTimer = setTimeout(() => {
      console.log('⏰ Exam duration completed - stopping security monitoring automatically');
      this.stopMonitoring();
      
      // Log exam completion violation
      this.logViolation({
        type: 'tab_switch',
        timestamp: new Date().toISOString(),
        details: 'Exam duration completed - security monitoring stopped automatically',
        severity: 'low'
      });
    }, durationMs);
    
    console.log(`⏰ Auto-stop timer set for ${durationMinutes} minutes`);
  }

  /**
   * Manually stop security monitoring (for exam completion)
   */
  stopSecurityForExamCompletion(): void {
    console.log('🏁 Exam completed - stopping security monitoring');
    
    // Clear auto-stop timer
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = undefined;
    }
    
    // Log exam completion
    this.logViolation({
      type: 'tab_switch',
      timestamp: new Date().toISOString(),
      details: 'Exam completed by candidate - security monitoring stopped',
      severity: 'low'
    });
    
    // Stop monitoring
    this.stopMonitoring();
  }

  /**
   * Check if security monitoring is active
   */
  isSecurityActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * TEMPORARY: Re-enable screenshot blocking (for after debugging)
   * Call this method to restore PrintScreen key blocking
   */
  enableScreenshotBlocking(): void {
    if (!this.config.disableKeys.includes('PrintScreen')) {
      this.config.disableKeys.push('PrintScreen');
      console.log('🔒 Screenshot blocking re-enabled');
    }
  }

  /**
   * TEMPORARY: Disable screenshot blocking (for debugging)
   * Call this method to allow screenshots during debugging
   */
  disableScreenshotBlocking(): void {
    const index = this.config.disableKeys.indexOf('PrintScreen');
    if (index > -1) {
      this.config.disableKeys.splice(index, 1);
      console.log('📸 Screenshot blocking disabled for debugging');
    }
  }

  /**
   * TEMPORARY: Disable all security measures for mobile debugging
   * This allows screenshots and other debugging tools on mobile devices
   */
  disableAllSecurityForDebugging(): void {
    // Disable all key blocking
    this.config.disableKeys = [];
    
    // Disable all prevention measures
    this.config.preventTabSwitch = false;
    this.config.preventWindowResize = false;
    this.config.preventContextMenu = false;
    this.config.preventDevTools = false;
    
    console.log('🔓 All security measures disabled for mobile debugging');
  }

  /**
   * TEMPORARY: Re-enable all security measures after debugging
   * This restores the original security configuration
   */
  enableAllSecurityAfterDebugging(): void {
    // Re-enable key blocking
    this.config.disableKeys = [
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'Tab', 'Alt', 'Ctrl', 'Meta', 'Shift',
      'PrintScreen', 'ScrollLock', 'Pause',
      'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
    ];
    
    // Re-enable all prevention measures
    this.config.preventTabSwitch = true;
    this.config.preventWindowResize = true;
    this.config.preventContextMenu = true;
    this.config.preventDevTools = true;
    
    console.log('🔒 All security measures re-enabled after debugging');
  }

  /**
   * Get remaining exam time (if auto-stop is configured)
   */
  getRemainingTime(): number | null {
    if (!this.examDuration || !this.autoStopTimer) {
      return null;
    }
    
    // This is a simplified implementation
    // In a real scenario, you'd track the start time more precisely
    return this.examDuration;
  }

  /**
   * Prevent ESC key from exiting fullscreen mode
   * 
   * This method uses multiple strategies to prevent ESC key from exiting fullscreen:
   * 1. Intercepts both keydown and keyup events
   * 2. Uses capture phase (true) to intercept before other handlers
   * 3. Prevents event propagation and immediate propagation
   * 4. Handles both document and window level events
   * 5. Does NOT log as violation since it's expected behavior
   */
  private preventEscKey(): void {
    const keydownHandler = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Escape' || keyboardEvent.code === 'Escape') {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        keyboardEvent.stopImmediatePropagation();
        console.warn('🚫 ESC key blocked to prevent fullscreen exit');
        return false;
      }
    };

    const keyupHandler = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Escape' || keyboardEvent.code === 'Escape') {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        keyboardEvent.stopImmediatePropagation();
        return false;
      }
    };

    // Use capture phase to intercept ESC key early on both keydown and keyup
    document.addEventListener('keydown', keydownHandler, true);
    document.addEventListener('keyup', keyupHandler, true);
    
    this.eventListeners.push({ event: 'keydown', handler: keydownHandler });
    this.eventListeners.push({ event: 'keyup', handler: keyupHandler });
    
    // Also prevent ESC on window level
    window.addEventListener('keydown', keydownHandler, true);
    window.addEventListener('keyup', keyupHandler, true);
    
    this.eventListeners.push({ event: 'keydown', handler: keydownHandler });
    this.eventListeners.push({ event: 'keyup', handler: keyupHandler });
  }

  /**
   * Disable keyboard shortcuts and functional keys
   */
  private disableKeyboardShortcuts(): void {
    const handler = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      const key = keyboardEvent.key;
      const code = keyboardEvent.code;
      
      // Check if the pressed key should be disabled
      if (this.config.disableKeys.includes(key) || 
          this.config.disableKeys.includes(code)) {
        
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        keyboardEvent.stopImmediatePropagation();
        
        this.logViolation({
          type: 'key_press',
          timestamp: new Date().toISOString(),
          details: `Disabled key pressed: ${key} (${code})`,
          severity: 'high'
        });
        
        console.warn(`🚫 Disabled key pressed: ${key}`);
        return false;
      }

      // Additional checks for common cheating shortcuts
      if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
        // Disable Ctrl/Cmd + key combinations
        if (['c', 'v', 'x', 'a', 'z', 'y', 's', 'p', 'f', 'g', 'h', 'r', 't', 'w', 'n', 'o'].includes(key.toLowerCase())) {
          keyboardEvent.preventDefault();
          keyboardEvent.stopPropagation();
          keyboardEvent.stopImmediatePropagation();
          
          this.logViolation({
            type: 'key_press',
            timestamp: new Date().toISOString(),
            details: `Disabled shortcut: ${keyboardEvent.ctrlKey ? 'Ctrl' : 'Cmd'}+${key}`,
            severity: 'high'
          });
          
          console.warn(`🚫 Disabled shortcut: ${keyboardEvent.ctrlKey ? 'Ctrl' : 'Cmd'}+${key}`);
          return false;
        }
      }

      // Disable Alt + Tab
      if (keyboardEvent.altKey && key === 'Tab') {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        keyboardEvent.stopImmediatePropagation();
        
        this.logViolation({
          type: 'key_press',
          timestamp: new Date().toISOString(),
          details: 'Alt+Tab combination blocked',
          severity: 'high'
        });
        
        console.warn('🚫 Alt+Tab blocked');
        return false;
      }
    };

    // Use capture phase (true) to intercept events early, before other handlers
    // This is critical for Firefox compatibility
    document.addEventListener('keydown', handler, true);
    window.addEventListener('keydown', handler, true);
    
    // Also add keyup handler for better coverage
    document.addEventListener('keyup', handler, true);
    window.addEventListener('keyup', handler, true);
    
    this.eventListeners.push({ event: 'keydown', handler });
    this.eventListeners.push({ event: 'keydown', handler }); // Window listener
    this.eventListeners.push({ event: 'keyup', handler });
    this.eventListeners.push({ event: 'keyup', handler }); // Window listener
  }

  /**
   * Prevent context menu
   */
  private preventContextMenu(): void {
    const handler = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      
      this.logViolation({
        type: 'context_menu',
        timestamp: new Date().toISOString(),
        details: 'Right-click context menu attempted',
        severity: 'medium'
      });
      
      console.warn('🚫 Right-click context menu blocked');
      return false;
    };

    document.addEventListener('contextmenu', handler, true);
    this.eventListeners.push({ event: 'contextmenu', handler });
  }

  /**
   * Prevent tab switching
   */
  private preventTabSwitching(): void {
    const handler = (event: BeforeUnloadEvent) => {
      const message = 'You are not allowed to leave the exam page. This action will be recorded.';
      event.preventDefault();
      event.returnValue = message;
      
      this.logViolation({
        type: 'tab_switch',
        timestamp: new Date().toISOString(),
        details: 'Attempt to leave exam page',
        severity: 'high'
      });
      
      console.warn('🚫 Attempt to leave exam page blocked');
      return message;
    };

    window.addEventListener('beforeunload', handler);
    this.eventListeners.push({ event: 'beforeunload', handler });
  }

  /**
   * Prevent window resize
   */
  private preventWindowResize(): void {
    const handler = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      
      this.logViolation({
        type: 'window_resize',
        timestamp: new Date().toISOString(),
        details: 'Window resize attempted',
        severity: 'medium'
      });
      
      console.warn('🚫 Window resize blocked');
      return false;
    };

    window.addEventListener('resize', handler);
    this.eventListeners.push({ event: 'resize', handler });
  }

  /**
   * Monitor for developer tools
   */
  private monitorDevTools(): void {
    let devtools = false;
    const threshold = 160;

    const handler = () => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools) {
          devtools = true;
          
          this.logViolation({
            type: 'dev_tools',
            timestamp: new Date().toISOString(),
            details: 'Developer tools detected',
            severity: 'high'
          });
          
          console.warn('🚫 Developer tools detected');
        }
      } else {
        devtools = false;
      }
    };

    setInterval(handler, 500);
  }

  /**
   * Monitor visibility changes (tab switching)
   */
  private monitorVisibilityChange(): void {
    const handler = () => {
      if (document.hidden) {
        this.logViolation({
          type: 'tab_switch',
          timestamp: new Date().toISOString(),
          details: 'Tab switched or minimized',
          severity: 'high'
        });
        
        console.warn('🚫 Tab switch/minimize detected');
      }
    };

    document.addEventListener('visibilitychange', handler);
    this.eventListeners.push({ event: 'visibilitychange', handler });
  }

  /**
   * Log a security violation
   */
  private logViolation(violation: SecurityViolation): void {
    if (!this.config.logViolations) return;

    this.violations.push(violation);
    
    // Call the violation callback if provided
    if (this.violationCallback) {
      this.violationCallback(violation);
    }

    // Log to console
    console.warn('🚨 Security Violation:', violation);

    // Check if max violations exceeded
    if (this.hasExceededMaxViolations()) {
      console.error('🚨 Maximum violations exceeded! Exam may be terminated.');
    }
  }
}

// Export singleton instance
export const examSecurityService = new ExamSecurityService();
