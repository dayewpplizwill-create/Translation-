/**
 * Safari-специфичная реализация переводчика
 * Использует встроенные возможности Safari для максимального качества и скорости
 * 
 * @version 1.0.0
 */

class SafariTranslator {
  constructor(options = {}) {
    this.targetLanguage = options.targetLanguage || 'ru';
    this.quality = options.quality || 'high';
    this.cache = new Map();
    this.translateQueue = [];
    this.isProcessing = false;

    this.init();
  }

  /**
   * Инициализация Safari переводчика
   */
  init() {
    // Проверяем наличие Safari Translation Framework
    if (window.webkit && window.webkit.messageHandlers) {
      console.log('✅ Safari Translation Framework обнаружен');
      this.useSafariFramework = true;
    }

    // Добавляем контекстное меню для быстрого перевода
    this.setupContextMenu();
    
    // Настраиваем горячие клавиши
    this.setupKeyboardShortcuts();
  }

  /**
   * Использовать встроенный Safari Translation Framework
   */
  async translatePageWithSafari() {
    if (!this.useSafariFramework) {
      console.warn('Safari Translation Framework не доступен');
      return false;
    }

    try {
      // Отправляем сообщение в Safari native code
      if (window.webkit && window.webkit.messageHandlers.translator) {
        window.webkit.messageHandlers.translator.postMessage({
          action: 'translate',
          targetLanguage: this.targetLanguage,
          quality: this.quality
        });
        
        console.log('📱 Запрос на перевод отправлен в Safari');
        return true;
      }
    } catch (error) {
      console.error('Safari translation error:', error);
      return false;
    }
  }

  /**
   * Перевести выделенный текст
   */
  async translateSelection() {
    const selectedText = window.getSelection().toString().trim();
    
    if (!selectedText) {
      console.warn('Нет выделенного текста');
      return null;
    }

    console.log('🔍 Переводу выделенный текст:', selectedText);
    
    return await this.translateText(selectedText);
  }

  /**
   * Перевести текст с оптимизацией для Safari
   */
  async translateText(text) {
    // Проверяем кэш
    if (this.cache.has(text)) {
      return this.cache.get(text);
    }

    try {
      // Если доступен Safari Framework, используем его
      if (this.useSafariFramework) {
        const result = await this.translateViaSafariAPI(text);
        this.cache.set(text, result);
        return result;
      } else {
        // Fallback на альтернативные методы
        const result = await this.translateViaAlternative(text);
        this.cache.set(text, result);
        return result;
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  /**
   * Перевод через Safari API
   */
  async translateViaSafariAPI(text) {
    return new Promise((resolve) => {
      const messageHandler = (event) => {
        if (event.detail && event.detail.translatedText) {
          resolve(event.detail.translatedText);
          window.removeEventListener('translationComplete', messageHandler);
        }
      };

      window.addEventListener('translationComplete', messageHandler);

      // Отправляем запрос на перевод
      if (window.webkit && window.webkit.messageHandlers.translator) {
        window.webkit.messageHandlers.translator.postMessage({
          action: 'translateText',
          text: text,
          targetLanguage: this.targetLanguage
        });
      }

      // Timeout если ответ не пришел
      setTimeout(() => {
        window.removeEventListener('translationComplete', messageHandler);
        resolve(text);
      }, 5000);
    });
  }

  /**
   * Альтернативный метод перевода
   */
  async translateViaAlternative(text) {
    if (!text || text.length === 0) return text;

    try {
      // Используем бесплатный API перевода
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${this.targetLanguage}`
      );
      
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        return data.responseData.translatedText;
      }

      // Если первый не сработал, пытаемся Google Translate
      return await this.translateViaGoogle(text);

    } catch (error) {
      console.error('Alternative translation failed:', error);
      return text;
    }
  }

  /**
   * Перевод через Google Translate
   */
  async translateViaGoogle(text) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${this.targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data && data[0] && data[0][0]) {
        return data[0][0][0];
      }

      return text;

    } catch (error) {
      console.error('Google translation failed:', error);
      return text;
    }
  }

  /**
   * Настроить контекстное меню
   */
  setupContextMenu() {
    document.addEventListener('contextmenu', (event) => {
      const selectedText = window.getSelection().toString().trim();
      
      if (selectedText) {
        console.log('📋 Контекстное меню: текст выделен');
        // В реальном приложении здесь можно добавить пункт меню
      }
    });
  }

  /**
   * Настроить горячие клавиши
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Cmd+Shift+T (macOS) или Ctrl+Shift+T для перевода
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyT') {
        event.preventDefault();
        this.translatePage();
      }

      // Cmd+Shift+S (macOS) или Ctrl+Shift+S для перевода выделения
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyS') {
        event.preventDefault();
        this.translateSelection();
      }
    });

    console.log('⌨️ Горячие клавиши установлены:');
    console.log('   Cmd+Shift+T (macOS) / Ctrl+Shift+T - перевести страницу');
    console.log('   Cmd+Shift+S (macOS) / Ctrl+Shift+S - перевести выделение');
  }

  /**
   * Получить информацию об окружении Safari
   */
  getSafariInfo() {
    return {
      isWebKit: !!window.webkit,
      hasTranslationFramework: !!window.webkit?.messageHandlers?.translator,
      userAgent: navigator.userAgent,
      language: navigator.language,
      isMacOS: /Mac/.test(navigator.userAgent),
      isiOS: /iPhone|iPad|iPod/.test(navigator.userAgent)
    };
  }

  /**
   * Перевести полную страницу
   */
  async translatePage() {
    console.log('🌐 Начинаю полный перевод страницы...');
    
    const startTime = performance.now();

    // Пытаемся использовать встроенный Safari переводчик
    const safariResult = await this.translatePageWithSafari();

    if (!safariResult) {
      // Если Safari переводчик не доступен, переводим DOM вручную
      await this.translateDOMManually();
    }

    const endTime = performance.now();
    console.log(`✅ Перевод завершен за ${(endTime - startTime).toFixed(2)}ms`);
  }

  /**
   * Перевести DOM вручную
   */
  async translateDOMManually() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodesToTranslate = [];
    let node;

    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text && text.length > 0 && !this.isExcludedElement(node.parentElement)) {
        nodesToTranslate.push(node);
      }
    }

    // Переводим пакетами
    const batchSize = 30;
    for (let i = 0; i < nodesToTranslate.length; i += batchSize) {
      const batch = nodesToTranslate.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (node) => {
        const translated = await this.translateText(node.textContent);
        if (translated && translated !== node.textContent) {
          node.textContent = translated;
        }
      }));

      // Небольшая задержка между пакетами для оптимизации
      await this.delay(50);
    }
  }

  /**
   * Проверить, нужно ли пропустить элемент
   */
  isExcludedElement(element) {
    const excludedTags = ['script', 'style', 'code', 'pre', 'noscript'];
    return excludedTags.includes(element?.tagName?.toLowerCase());
  }

  /**
   * Задержка (утилита)
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Получить статистику кэша
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cachedItems: Array.from(this.cache.entries()).slice(0, 10)
    };
  }

  /**
   * Очистить кэш
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️  Кэш очищен');
  }
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const safariTranslator = new SafariTranslator({
      targetLanguage: 'ru',
      quality: 'high'
    });
    window.safariTranslator = safariTranslator;
    console.log('Safari Translator готов к использованию');
  });
} else {
  const safariTranslator = new SafariTranslator({
    targetLanguage: 'ru',
    quality: 'high'
  });
  window.safariTranslator = safariTranslator;
  console.log('Safari Translator готов к использованию');
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafariTranslator;
}
