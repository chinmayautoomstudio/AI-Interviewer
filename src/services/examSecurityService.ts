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

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      disableKeys: [
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        'Tab', 'Alt', 'Ctrl', 'Meta', 'Shift',
        'PrintScreen', 'ScrollLock', 'Pause',
        'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Escape'
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
   * Start monitoring for security violations
   */
  startMonitoring(callback?: (violation: SecurityViolation) => void): void {
    if (this.isMonitoring) {
      console.warn('Security monitoring is already active');
      return;
    }

    this.violationCallback = callback;
    this.isMonitoring = true;
    this.violations = [];

    console.log('🔒 Starting exam security monitoring...');

    // Disable keyboard shortcuts
    this.disableKeyboardShortcuts();

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

    console.log('✅ Security monitoring stopped successfully');
  }

  /**
   * Enter fullscreen mode
   */
  async enterFullscreen(): Promise<boolean> {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }

      this.isFullscreen = true;
      console.log('✅ Entered fullscreen mode');
      return true;
    } catch (error) {
      console.error('❌ Failed to enter fullscreen:', error);
      this.logViolation({
        type: 'window_resize',
        timestamp: new Date().toISOString(),
        details: 'Failed to enter fullscreen mode',
        severity: 'medium'
      });
      return false;
    }
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen(): Promise<boolean> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
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

    document.addEventListener('keydown', handler, true);
    this.eventListeners.push({ event: 'keydown', handler });
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
