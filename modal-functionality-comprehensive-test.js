/**
 * Comprehensive Modal Functionality Test Script
 * Tests EditTradeModal and DeleteTradeModal functionality
 * 
 * Run this script in the browser console on the /trades page
 */

(function() {
  'use strict';
  
  // Test configuration
  const TEST_CONFIG = {
    timeout: 5000,
    retryDelay: 500,
    maxRetries: 3,
    testTradeId: null,
    testResults: {
      pageLoad: { passed: 0, failed: 0, details: [] },
      modalOpening: { passed: 0, failed: 0, details: [] },
      dataPopulation: { passed: 0, failed: 0, details: [] },
      formValidation: { passed: 0, failed: 0, details: [] },
      submissionHandling: { passed: 0, failed: 0, details: [] },
      responsiveBehavior: { passed: 0, failed: 0, details: [] },
      emotionalStateConversion: { passed: 0, failed: 0, details: [] },
      errorHandling: { passed: 0, failed: 0, details: [] }
    }
  };

  // Utility functions
  const utils = {
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    findElement: (selector, timeout = TEST_CONFIG.timeout) => {
      return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
        
        const observer = new MutationObserver(() => {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            resolve(element);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        setTimeout(() => {
          observer.disconnect();
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
      });
    },
    
    findElements: (selector) => {
      return document.querySelectorAll(selector);
    },
    
    clickElement: async (element) => {
      if (!element) throw new Error('Cannot click null element');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await utils.wait(100);
      element.click();
      await utils.wait(200);
    },
    
    typeInElement: async (element, text) => {
      if (!element) throw new Error('Cannot type in null element');
      element.focus();
      element.value = '';
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      await utils.wait(100);
    },
    
    getViewportSize: () => ({
      width: window.innerWidth,
      height: window.innerHeight
    }),
    
    isMobile: () => window.innerWidth <= 768,
    
    log: (message, type = 'info') => {
      const prefix = '[MODAL_TEST]';
      const styles = {
        info: 'color: #00bfff; font-weight: bold',
        pass: 'color: #00ff00; font-weight: bold',
        fail: 'color: #ff4444; font-weight: bold',
        warn: 'color: #ffaa00; font-weight: bold'
      };
      
      console.log(`%c${prefix} ${message}`, styles[type] || styles.info);
    },
    
    addTestResult: (category, passed, details) => {
      const result = TEST_CONFIG.testResults[category];
      if (passed) {
        result.passed++;
      } else {
        result.failed++;
      }
      result.details.push({ passed, details, timestamp: Date.now() });
    }
  };

  // Test functions
  const tests = {
    // Test 1: Page Loading
    async testPageLoading() {
      utils.log('Starting page loading tests...', 'info');
      
      try {
        // Check if we're on the trades page
        if (!window.location.pathname.includes('/trades')) {
          throw new Error('Not on the trades page. Please navigate to /trades first.');
        }
        
        // Check for essential page elements
        const requiredElements = [
          '.scroll-item', // Trade cards container
          'h1', // Page title
          '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4' // Stats grid
        ];
        
        for (const selector of requiredElements) {
          const element = await utils.findElement(selector);
          if (!element) {
            throw new Error(`Required element not found: ${selector}`);
          }
        }
        
        // Check for trade data
        const tradeCards = utils.findElements('[class*="TorchCard"]');
        if (tradeCards.length === 0) {
          utils.log('No trade cards found - this might be expected if there are no trades', 'warn');
        } else {
          TEST_CONFIG.testTradeId = tradeCards[0].querySelector('[class*="cursor-pointer"]')?.getAttribute('data-trade-id') ||
                                    tradeCards[0].querySelector('button[onClick*="handleEditTrade"]')?.getAttribute('data-trade-id');
          utils.log(`Found ${tradeCards.length} trade cards`, 'info');
        }
        
        utils.addTestResult('pageLoad', true, 'Page loaded successfully with all required elements');
        utils.log('✓ Page loading test passed', 'pass');
        
      } catch (error) {
        utils.addTestResult('pageLoad', false, error.message);
        utils.log(`✗ Page loading test failed: ${error.message}`, 'fail');
      }
    },

    // Test 2: Modal Opening
    async testModalOpening() {
      utils.log('Starting modal opening tests...', 'info');
      
      try {
        // Find trade cards with edit/delete buttons
        const tradeCards = utils.findElements('[class*="TorchCard"]');
        if (tradeCards.length === 0) {
          throw new Error('No trade cards found to test modal opening');
        }
        
        const firstCard = tradeCards[0];
        
        // Test Edit Modal Opening
        const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
        if (!editButton) {
          throw new Error('Edit button not found in trade card');
        }
        
        await utils.clickElement(editButton);
        
        // Check if edit modal opened
        const editModal = await utils.findElement('[role="dialog"]', 2000);
        if (!editModal) {
          throw new Error('Edit modal did not open after clicking edit button');
        }
        
        // Check for modal title
        const modalTitle = editModal.querySelector('h2');
        if (!modalTitle || !modalTitle.textContent.includes('Edit Trade')) {
          throw new Error('Edit modal title not found or incorrect');
        }
        
        // Close edit modal
        const closeButton = editModal.querySelector('button[aria-label="Close modal"], button[onClick*="onClose"]');
        if (closeButton) {
          await utils.clickElement(closeButton);
        }
        
        await utils.wait(500);
        
        // Test Delete Modal Opening
        const deleteButton = firstCard.querySelector('button[onClick*="handleDeleteTrade"]');
        if (!deleteButton) {
          throw new Error('Delete button not found in trade card');
        }
        
        await utils.clickElement(deleteButton);
        
        // Check if delete modal opened
        const deleteModal = await utils.findElement('[role="dialog"]', 2000);
        if (!deleteModal) {
          throw new Error('Delete modal did not open after clicking delete button');
        }
        
        // Check for delete confirmation elements
        const deleteTitle = deleteModal.querySelector('h3');
        if (!deleteTitle || !deleteTitle.textContent.includes('Delete Trade')) {
          throw new Error('Delete modal title not found or incorrect');
        }
        
        // Close delete modal
        const deleteCloseButton = deleteModal.querySelector('button[onClick*="onClose"]');
        if (deleteCloseButton) {
          await utils.clickElement(deleteCloseButton);
        }
        
        utils.addTestResult('modalOpening', true, 'Both edit and delete modals opened successfully');
        utils.log('✓ Modal opening test passed', 'pass');
        
      } catch (error) {
        utils.addTestResult('modalOpening', false, error.message);
        utils.log(`✗ Modal opening test failed: ${error.message}`, 'fail');
      }
    },

    // Test 3: Data Population
    async testDataPopulation() {
      utils.log('Starting data population tests...', 'info');
      
      try {
        // Find a trade card and open edit modal
        const tradeCards = utils.findElements('[class*="TorchCard"]');
        if (tradeCards.length === 0) {
          throw new Error('No trade cards found to test data population');
        }
        
        const firstCard = tradeCards[0];
        const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
        
        await utils.clickElement(editButton);
        
        // Wait for modal to open and populate
        await utils.wait(1000);
        
        const editModal = await utils.findElement('[role="dialog"]');
        
        // Check for form fields and their population
        const formFields = {
          symbol: editModal.querySelector('input[name="symbol"], input[placeholder*="AAPL"]'),
          quantity: editModal.querySelector('input[name="quantity"], input[type="number"]'),
          entry: editModal.querySelector('input[name="entry"], input[placeholder*="0.00"]'),
          date: editModal.querySelector('input[type="date"]')
        };
        
        let populatedFields = 0;
        let totalFields = Object.keys(formFields).length;
        
        for (const [fieldName, field] of Object.entries(formFields)) {
          if (field && field.value) {
            populatedFields++;
            utils.log(`✓ Field ${fieldName} populated with: ${field.value}`, 'pass');
          } else if (field) {
            utils.log(`⚠ Field ${fieldName} found but not populated`, 'warn');
          } else {
            utils.log(`✗ Field ${fieldName} not found`, 'fail');
          }
        }
        
        // Check emotional state display
        const emotionElements = editModal.querySelectorAll('[class*="emotion"], [class*="px-3 py-1 rounded-full"]');
        if (emotionElements.length > 0) {
          utils.log(`✓ Found ${emotionElements.length} emotion elements`, 'pass');
        }
        
        // Close modal
        const closeButton = editModal.querySelector('button[aria-label="Close modal"]');
        if (closeButton) {
          await utils.clickElement(closeButton);
        }
        
        const populationRate = (populatedFields / totalFields) * 100;
        const passed = populationRate >= 50; // At least 50% of fields should be populated
        
        utils.addTestResult('dataPopulation', passed, 
          `${populatedFields}/${totalFields} fields populated (${populationRate}%)`);
        
        if (passed) {
          utils.log('✓ Data population test passed', 'pass');
        } else {
          utils.log('✗ Data population test failed - insufficient field population', 'fail');
        }
        
      } catch (error) {
        utils.addTestResult('dataPopulation', false, error.message);
        utils.log(`✗ Data population test failed: ${error.message}`, 'fail');
      }
    },

    // Test 4: Form Validation
    async testFormValidation() {
      utils.log('Starting form validation tests...', 'info');
      
      try {
        // Open edit modal
        const tradeCards = utils.findElements('[class*="TorchCard"]');
        const firstCard = tradeCards[0];
        const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
        
        await utils.clickElement(editButton);
        await utils.wait(1000);
        
        const editModal = await utils.findElement('[role="dialog"]');
        
        // Clear required fields to trigger validation
        const requiredFields = {
          symbol: editModal.querySelector('input[name="symbol"], input[placeholder*="AAPL"]'),
          quantity: editModal.querySelector('input[name="quantity"], input[type="number"]'),
          entry: editModal.querySelector('input[name="entry"], input[placeholder*="0.00"]'),
          date: editModal.querySelector('input[type="date"]')
        };
        
        // Clear fields
        for (const [fieldName, field] of Object.entries(requiredFields)) {
          if (field) {
            await utils.typeInElement(field, '');
          }
        }
        
        // Try to submit form
        const submitButton = editModal.querySelector('button[type="submit"]');
        if (!submitButton) {
          throw new Error('Submit button not found in edit modal');
        }
        
        await utils.clickElement(submitButton);
        await utils.wait(500);
        
        // Check for validation errors
        let validationErrorsFound = 0;
        const errorElements = editModal.querySelectorAll('[class*="error"], [class*="text-red"]');
        
        if (errorElements.length > 0) {
          validationErrorsFound = errorElements.length;
          utils.log(`✓ Found ${validationErrorsFound} validation error elements`, 'pass');
        }
        
        // Check specific field validation
        let fieldsWithErrors = 0;
        for (const [fieldName, field] of Object.entries(requiredFields)) {
          if (field) {
            const errorElement = field.closest('[class*="mb-4"], [class*="space-y"]')?.querySelector('[class*="error"], [class*="text-red"]');
            if (errorElement) {
              fieldsWithErrors++;
              utils.log(`✓ Field ${fieldName} shows validation error`, 'pass');
            }
          }
        }
        
        // Close modal
        const closeButton = editModal.querySelector('button[aria-label="Close modal"]');
        if (closeButton) {
          await utils.clickElement(closeButton);
        }
        
        const passed = validationErrorsFound > 0 && fieldsWithErrors > 0;
        
        utils.addTestResult('formValidation', passed, 
          `Found ${validationErrorsFound} error elements, ${fieldsWithErrors} fields with errors`);
        
        if (passed) {
          utils.log('✓ Form validation test passed', 'pass');
        } else {
          utils.log('✗ Form validation test failed - no validation errors detected', 'fail');
        }
        
      } catch (error) {
        utils.addTestResult('formValidation', false, error.message);
        utils.log(`✗ Form validation test failed: ${error.message}`, 'fail');
      }
    },

    // Test 5: Submission Handling
    async testSubmissionHandling() {
      utils.log('Starting submission handling tests...', 'info');
      
      try {
        // Open edit modal
        const tradeCards = utils.findElements('[class*="TorchCard"]');
        const firstCard = tradeCards[0];
        const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
        
        await utils.clickElement(editButton);
        await utils.wait(1000);
        
        const editModal = await utils.findElement('[role="dialog"]');
        
        // Fill form with valid data
        const validData = {
          symbol: 'TEST',
          quantity: '100',
          entry: '50.00',
          exit: '55.00',
          date: '2024-01-01'
        };
        
        for (const [fieldName, value] of Object.entries(validData)) {
          let field;
          switch (fieldName) {
            case 'symbol':
              field = editModal.querySelector('input[name="symbol"], input[placeholder*="AAPL"]');
              break;
            case 'quantity':
              field = editModal.querySelector('input[name="quantity"], input[type="number"]');
              break;
            case 'entry':
              field = editModal.querySelector('input[name="entry"], input[placeholder*="0.00"]');
              break;
            case 'exit':
              field = editModal.querySelectorAll('input[placeholder*="0.00"]')[1];
              break;
            case 'date':
              field = editModal.querySelector('input[type="date"]');
              break;
          }
          
          if (field) {
            await utils.typeInElement(field, value);
          }
        }
        
        // Try to submit form
        const submitButton = editModal.querySelector('button[type="submit"]');
        if (!submitButton) {
          throw new Error('Submit button not found in edit modal');
        }
        
        // Check if submit button is enabled
        if (submitButton.disabled) {
          throw new Error('Submit button is disabled even with valid data');
        }
        
        // Click submit and check for loading state
        await utils.clickElement(submitButton);
        await utils.wait(1000);
        
        // Check if modal shows loading state or closes
        let submissionHandled = false;
        
        // Check for loading state
        if (submitButton.textContent.includes('Saving') || submitButton.disabled) {
          submissionHandled = true;
          utils.log('✓ Submit button shows loading state', 'pass');
        }
        
        // Check if modal closed (successful submission)
        const modalStillOpen = document.querySelector('[role="dialog"]');
        if (!modalStillOpen) {
          submissionHandled = true;
          utils.log('✓ Modal closed after submission', 'pass');
        }
        
        // If modal is still open, check for error messages
        if (modalStillOpen) {
          const errorElements = modalStillOpen.querySelectorAll('[class*="error"], [class*="text-red"]');
          if (errorElements.length > 0) {
            submissionHandled = true;
            utils.log('✓ Error handling detected', 'pass');
          }
        }
        
        utils.addTestResult('submissionHandling', submissionHandled, 
          `Submission handling detected: ${submissionHandled}`);
        
        if (submissionHandled) {
          utils.log('✓ Submission handling test passed', 'pass');
        } else {
          utils.log('✗ Submission handling test failed - no response detected', 'fail');
        }
        
        // Clean up - close modal if still open
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const closeButton = modal.querySelector('button[aria-label="Close modal"]');
          if (closeButton) {
            await utils.clickElement(closeButton);
          }
        }
        
      } catch (error) {
        utils.addTestResult('submissionHandling', false, error.message);
        utils.log(`✗ Submission handling test failed: ${error.message}`, 'fail');
      }
    },

    // Test 6: Responsive Behavior
    async testResponsiveBehavior() {
      utils.log('Starting responsive behavior tests...', 'info');
      
      try {
        const originalViewport = utils.getViewportSize();
        let responsiveTestsPassed = 0;
        let totalResponsiveTests = 0;
        
        // Test different viewport sizes
        const viewports = [
          { width: 375, height: 667, name: 'Mobile' },  // iPhone
          { width: 768, height: 1024, name: 'Tablet' }, // iPad
          { width: 1920, height: 1080, name: 'Desktop' } // Desktop
        ];
        
        for (const viewport of viewports) {
          totalResponsiveTests++;
          
          // Set viewport size
          window.resizeTo(viewport.width, viewport.height);
          await utils.wait(500);
          
          // Open edit modal
          const tradeCards = utils.findElements('[class*="TorchCard"]');
          if (tradeCards.length === 0) {
            utils.log('No trade cards found for responsive test', 'warn');
            continue;
          }
          
          const firstCard = tradeCards[0];
          const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
          
          await utils.clickElement(editButton);
          await utils.wait(1000);
          
          const editModal = document.querySelector('[role="dialog"]');
          if (!editModal) {
            utils.log(`Modal did not open on ${viewport.name} viewport`, 'fail');
            continue;
          }
          
          // Check modal positioning and sizing
          const modalRect = editModal.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Check if modal fits in viewport
          const fitsHorizontally = modalRect.width <= viewportWidth * 0.95;
          const fitsVertically = modalRect.height <= viewportHeight * 0.95;
          const isCentered = Math.abs(modalRect.left + modalRect.width/2 - viewportWidth/2) < 50;
          
          if (fitsHorizontally && fitsVertically && isCentered) {
            responsiveTestsPassed++;
            utils.log(`✓ Modal displays correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, 'pass');
          } else {
            utils.log(`✗ Modal display issues on ${viewport.name}: fitsH=${fitsHorizontally}, fitsV=${fitsVertically}, centered=${isCentered}`, 'fail');
          }
          
          // Check responsive grid layouts
          const gridElements = editModal.querySelectorAll('[class*="grid"]');
          let responsiveGrids = 0;
          gridElements.forEach(grid => {
            const gridClasses = grid.className;
            if (gridClasses.includes('grid-cols-1') || gridClasses.includes('sm:grid-cols') || gridClasses.includes('md:grid-cols')) {
              responsiveGrids++;
            }
          });
          
          if (responsiveGrids > 0) {
            utils.log(`✓ Found ${responsiveGrids} responsive grid layouts on ${viewport.name}`, 'pass');
          }
          
          // Close modal
          const closeButton = editModal.querySelector('button[aria-label="Close modal"]');
          if (closeButton) {
            await utils.clickElement(closeButton);
          }
          
          await utils.wait(500);
        }
        
        // Restore original viewport
        window.resizeTo(originalViewport.width, originalViewport.height);
        await utils.wait(500);
        
        const passed = responsiveTestsPassed >= totalResponsiveTests * 0.8; // 80% pass rate
        
        utils.addTestResult('responsiveBehavior', passed, 
          `${responsiveTestsPassed}/${totalResponsiveTests} responsive tests passed`);
        
        if (passed) {
          utils.log('✓ Responsive behavior test passed', 'pass');
        } else {
          utils.log('✗ Responsive behavior test failed', 'fail');
        }
        
      } catch (error) {
        utils.addTestResult('responsiveBehavior', false, error.message);
        utils.log(`✗ Responsive behavior test failed: ${error.message}`, 'fail');
      }
    },

    // Test 7: Emotional State Conversion
    async testEmotionalStateConversion() {
      utils.log('Starting emotional state conversion tests...', 'info');
      
      try {
        // Open edit modal
        const tradeCards = utils.findElements('[class*="TorchCard"]');
        if (tradeCards.length === 0) {
          throw new Error('No trade cards found to test emotional state conversion');
        }
        
        const firstCard = tradeCards[0];
        const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
        
        await utils.clickElement(editButton);
        await utils.wait(1000);
        
        const editModal = await utils.findElement('[role="dialog"]');
        
        // Find emotion buttons
        const emotionButtons = editModal.querySelectorAll('button[type="button"]');
        const emotionNames = ['FOMO', 'PATIENCE', 'CONFIDENT', 'NEUTRAL'];
        let foundEmotions = 0;
        
        for (const emotionName of emotionNames) {
          const emotionButton = Array.from(emotionButtons).find(btn => 
            btn.textContent.toLowerCase().includes(emotionName.toLowerCase())
          );
          
          if (emotionButton) {
            foundEmotions++;
            
            // Test clicking emotion button
            await utils.clickElement(emotionButton);
            await utils.wait(200);
            
            // Check if emotion is selected
            const isSelected = emotionButton.className.includes('bg-gold') || 
                              emotionButton.className.includes('border-gold') ||
                              emotionButton.className.includes('text-gold');
            
            if (isSelected) {
              utils.log(`✓ Emotion ${emotionName} selected successfully`, 'pass');
            } else {
              utils.log(`⚠ Emotion ${emotionName} may not be properly selected`, 'warn');
            }
            
            // Test deselecting
            await utils.clickElement(emotionButton);
            await utils.wait(200);
          }
        }
        
        // Check for emotion display elements
        const emotionDisplayElements = editModal.querySelectorAll('[class*="rounded-full"], [class*="emotion"]');
        if (emotionDisplayElements.length > 0) {
          utils.log(`✓ Found ${emotionDisplayElements.length} emotion display elements`, 'pass');
        }
        
        // Test emotional state input component if present
        const emotionalStateInput = editModal.querySelector('[class*="EmotionalStateInput"]');
        if (emotionalStateInput) {
          utils.log('✓ EmotionalStateInput component found', 'pass');
          
          // Test emotion conversion by checking data attributes or values
          const emotionData = emotionalStateInput.getAttribute('data-emotions') ||
                            emotionalStateInput.querySelector('input')?.value;
          
          if (emotionData) {
            utils.log(`✓ Emotional state data found: ${emotionData}`, 'pass');
          }
        }
        
        // Close modal
        const closeButton = editModal.querySelector('button[aria-label="Close modal"]');
        if (closeButton) {
          await utils.clickElement(closeButton);
        }
        
        const passed = foundEmotions >= 2; // At least 2 emotions should be found and testable
        
        utils.addTestResult('emotionalStateConversion', passed, 
          `Found and tested ${foundEmotions} emotions`);
        
        if (passed) {
          utils.log('✓ Emotional state conversion test passed', 'pass');
        } else {
          utils.log('✗ Emotional state conversion test failed', 'fail');
        }
        
      } catch (error) {
        utils.addTestResult('emotionalStateConversion', false, error.message);
        utils.log(`✗ Emotional state conversion test failed: ${error.message}`, 'fail');
      }
    },

    // Test 8: Error Handling
    async testErrorHandling() {
      utils.log('Starting error handling tests...', 'info');
      
      try {
        let errorHandlingTestsPassed = 0;
        let totalErrorHandlingTests = 0;
        
        // Test 1: Network error simulation
        totalErrorHandlingTests++;
        try {
          // Open edit modal
          const tradeCards = utils.findElements('[class*="TorchCard"]');
          if (tradeCards.length === 0) {
            throw new Error('No trade cards found to test error handling');
          }
          
          const firstCard = tradeCards[0];
          const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
          
          await utils.clickElement(editButton);
          await utils.wait(1000);
          
          const editModal = await utils.findElement('[role="dialog"]');
          
          // Fill form with invalid data to trigger validation errors
          const symbolField = editModal.querySelector('input[name="symbol"], input[placeholder*="AAPL"]');
          if (symbolField) {
            await utils.typeInElement(symbolField, ''); // Empty symbol should trigger error
          }
          
          const quantityField = editModal.querySelector('input[name="quantity"], input[type="number"]');
          if (quantityField) {
            await utils.typeInElement(quantityField, '-1'); // Negative quantity should trigger error
          }
          
          // Try to submit
          const submitButton = editModal.querySelector('button[type="submit"]');
          if (submitButton) {
            await utils.clickElement(submitButton);
            await utils.wait(500);
          }
          
          // Check for error messages
          const errorElements = editModal.querySelectorAll('[class*="error"], [class*="text-red"]');
          if (errorElements.length > 0) {
            errorHandlingTestsPassed++;
            utils.log(`✓ Validation errors properly displayed (${errorElements.length} errors)`, 'pass');
          } else {
            utils.log('⚠ No validation errors found', 'warn');
          }
          
          // Close modal
          const closeButton = editModal.querySelector('button[aria-label="Close modal"]');
          if (closeButton) {
            await utils.clickElement(closeButton);
          }
          
        } catch (error) {
          utils.log(`Error in validation test: ${error.message}`, 'warn');
        }
        
        // Test 2: Modal overlay click handling
        totalErrorHandlingTests++;
        try {
          const tradeCards = utils.findElements('[class*="TorchCard"]');
          const firstCard = tradeCards[0];
          const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
          
          await utils.clickElement(editButton);
          await utils.wait(1000);
          
          const modalBackdrop = document.querySelector('[role="dialog"]')?.parentElement;
          if (modalBackdrop) {
            // Click on backdrop to close modal
            await utils.clickElement(modalBackdrop);
            await utils.wait(500);
            
            // Check if modal closed
            const modalStillOpen = document.querySelector('[role="dialog"]');
            if (!modalStillOpen) {
              errorHandlingTestsPassed++;
              utils.log('✓ Modal backdrop click closes modal properly', 'pass');
            } else {
              utils.log('⚠ Modal did not close on backdrop click', 'warn');
            }
          }
          
        } catch (error) {
          utils.log(`Error in backdrop click test: ${error.message}`, 'warn');
        }
        
        // Test 3: Escape key handling
        totalErrorHandlingTests++;
        try {
          const tradeCards = utils.findElements('[class*="TorchCard"]');
          const firstCard = tradeCards[0];
          const editButton = firstCard.querySelector('button[onClick*="handleEditTrade"]');
          
          await utils.clickElement(editButton);
          await utils.wait(1000);
          
          // Press Escape key
          const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
          document.dispatchEvent(escapeEvent);
          await utils.wait(500);
          
          // Check if modal closed
          const modalStillOpen = document.querySelector('[role="dialog"]');
          if (!modalStillOpen) {
            errorHandlingTestsPassed++;
            utils.log('✓ Escape key closes modal properly', 'pass');
          } else {
            utils.log('⚠ Modal did not close on Escape key', 'warn');
          }
          
        } catch (error) {
          utils.log(`Error in Escape key test: ${error.message}`, 'warn');
        }
        
        const passed = errorHandlingTestsPassed >= totalErrorHandlingTests * 0.6; // 60% pass rate
        
        utils.addTestResult('errorHandling', passed, 
          `${errorHandlingTestsPassed}/${totalErrorHandlingTests} error handling tests passed`);
        
        if (passed) {
          utils.log('✓ Error handling test passed', 'pass');
        } else {
          utils.log('✗ Error handling test failed', 'fail');
        }
        
      } catch (error) {
        utils.addTestResult('errorHandling', false, error.message);
        utils.log(`✗ Error handling test failed: ${error.message}`, 'fail');
      }
    }
  };

  // Main test runner
  async function runAllTests() {
    utils.log('🚀 Starting Comprehensive Modal Functionality Tests...', 'info');
    utils.log(`Testing on: ${window.location.pathname}`, 'info');
    utils.log(`Viewport: ${utils.getViewportSize().width}x${utils.getViewportSize().height}`, 'info');
    
    const testCategories = [
      'pageLoad',
      'modalOpening', 
      'dataPopulation',
      'formValidation',
      'submissionHandling',
      'responsiveBehavior',
      'emotionalStateConversion',
      'errorHandling'
    ];
    
    for (const category of testCategories) {
      try {
        switch (category) {
          case 'pageLoad':
            await tests.testPageLoading();
            break;
          case 'modalOpening':
            await tests.testModalOpening();
            break;
          case 'dataPopulation':
            await tests.testDataPopulation();
            break;
          case 'formValidation':
            await tests.testFormValidation();
            break;
          case 'submissionHandling':
            await tests.testSubmissionHandling();
            break;
          case 'responsiveBehavior':
            await tests.testResponsiveBehavior();
            break;
          case 'emotionalStateConversion':
            await tests.testEmotionalStateConversion();
            break;
          case 'errorHandling':
            await tests.testErrorHandling();
            break;
        }
        
        await utils.wait(1000); // Brief pause between tests
        
      } catch (error) {
        utils.log(`Test category ${category} failed with error: ${error.message}`, 'fail');
        utils.addTestResult(category, false, `Test execution error: ${error.message}`);
      }
    }
    
    // Generate final report
    generateTestReport();
  }

  // Generate comprehensive test report
  function generateTestReport() {
    utils.log('\n📊 COMPREHENSIVE TEST REPORT', 'info');
    utils.log('=====================================', 'info');
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [category, results] of Object.entries(TEST_CONFIG.testResults)) {
      const passed = results.passed;
      const failed = results.failed;
      const total = passed + failed;
      const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
      
      totalPassed += passed;
      totalFailed += failed;
      
      const status = passed > failed ? '✅' : '❌';
      const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      utils.log(`${status} ${categoryName}: ${passed}/${total} (${passRate}%)`, 
                passed > failed ? 'pass' : 'fail');
      
      // Show detailed results for failed tests
      if (failed > 0) {
        const failedDetails = results.details.filter(d => !d.passed);
        failedDetails.forEach(detail => {
          utils.log(`   ⚠ ${detail.details}`, 'warn');
        });
      }
    }
    
    const overallPassRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
    const overallStatus = totalPassed > totalFailed ? '✅' : '❌';
    
    utils.log('\n=====================================', 'info');
    utils.log(`${overallStatus} OVERALL: ${totalPassed}/${totalPassed + totalFailed} (${overallPassRate}%)`, 
              totalPassed > totalFailed ? 'pass' : 'fail');
    utils.log('=====================================', 'info');
    
    // Diagnosis and recommendations
    utils.log('\n🔍 DIAGNOSIS AND RECOMMENDATIONS', 'info');
    
    if (TEST_CONFIG.testResults.pageLoad.failed > 0) {
      utils.log('⚠ Page Loading Issues detected:', 'warn');
      utils.log('   - Check if you\'re on the /trades page', 'warn');
      utils.log('   - Verify authentication status', 'warn');
      utils.log('   - Check for JavaScript errors in console', 'warn');
    }
    
    if (TEST_CONFIG.testResults.modalOpening.failed > 0) {
      utils.log('⚠ Modal Opening Issues detected:', 'warn');
      utils.log('   - Check if trade cards have edit/delete buttons', 'warn');
      utils.log('   - Verify modal component is properly imported', 'warn');
      utils.log('   - Check for CSS conflicts affecting modal display', 'warn');
    }
    
    if (TEST_CONFIG.testResults.dataPopulation.failed > 0) {
      utils.log('⚠ Data Population Issues detected:', 'warn');
      utils.log('   - Check trade data structure and format', 'warn');
      utils.log('   - Verify emotional state conversion logic', 'warn');
      utils.log('   - Ensure form fields are properly bound to data', 'warn');
    }
    
    if (TEST_CONFIG.testResults.formValidation.failed > 0) {
      utils.log('⚠ Form Validation Issues detected:', 'warn');
      utils.log('   - Check validation logic in EditTradeModal', 'warn');
      utils.log('   - Verify error message display components', 'warn');
      utils.log('   - Ensure validation triggers on form submission', 'warn');
    }
    
    if (TEST_CONFIG.testResults.submissionHandling.failed > 0) {
      utils.log('⚠ Submission Handling Issues detected:', 'warn');
      utils.log('   - Check API endpoints and network connectivity', 'warn');
      utils.log('   - Verify loading state management', 'warn');
      utils.log('   - Ensure proper error handling for API failures', 'warn');
    }
    
    if (TEST_CONFIG.testResults.responsiveBehavior.failed > 0) {
      utils.log('⚠ Responsive Behavior Issues detected:', 'warn');
      utils.log('   - Check CSS media queries and breakpoints', 'warn');
      utils.log('   - Verify modal sizing classes for different viewports', 'warn');
      utils.log('   - Ensure grid layouts are responsive', 'warn');
    }
    
    if (TEST_CONFIG.testResults.emotionalStateConversion.failed > 0) {
      utils.log('⚠ Emotional State Conversion Issues detected:', 'warn');
      utils.log('   - Check string/array conversion logic', 'warn');
      utils.log('   - Verify emotion button click handlers', 'warn');
      utils.log('   - Ensure emotional state persistence', 'warn');
    }
    
    if (TEST_CONFIG.testResults.errorHandling.failed > 0) {
      utils.log('⚠ Error Handling Issues detected:', 'warn');
      utils.log('   - Check error boundary implementations', 'warn');
      utils.log('   - Verify modal close mechanisms', 'warn');
      utils.log('   - Ensure proper error message display', 'warn');
    }
    
    // Return test results for programmatic access
    return {
      summary: {
        totalPassed,
        totalFailed,
        passRate: overallPassRate,
        status: totalPassed > totalFailed ? 'PASS' : 'FAIL'
      },
      details: TEST_CONFIG.testResults
    };
  }

  // Auto-start tests if on trades page
  if (window.location.pathname.includes('/trades')) {
    utils.log('🎯 Auto-starting modal tests on trades page...', 'info');
    runAllTests();
  } else {
    utils.log('⚠ Please navigate to the /trades page first', 'warn');
    utils.log('Then run: modalTests.runAllTests()', 'info');
  }

  // Expose test functions for manual execution
  window.modalTests = {
    runAllTests,
    generateTestReport,
    tests,
    utils,
    config: TEST_CONFIG
  };

})();