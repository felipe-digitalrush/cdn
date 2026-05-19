/**
 * tradehub/scripts.js
 * Scripts principais — TradeHub GPS
 *
 * Placement: End of <body>
 * Carregado em: todas as LPs da TradeHub
 * Depende de: validation.js (deve carregar antes)
 *
 * ═══════════════════════════════════════════════════════════════
 *  CONFIGURAÇÃO POR PÁGINA — editar apenas aqui
 *  Chave = pathname da URL (ex: '/lp-promotores/')
 *  Páginas não listadas usam client.* como fallback
 * ═══════════════════════════════════════════════════════════════
 */

var SCRIPTS_CONFIG = {

  // ── Configuração global do cliente ──────────────────────────
  client: {
    webhookUrl:  'https://hook.eu1.make.com/eujc1gbjvnybm6uajh6od88pjxa4o35x',
    redirectUrl: 'https://api.whatsapp.com/send?phone=5511998181875&text=Ol%C3%A1!%20Gostaria%20de%20conhecer%20melhor%20o%20produto.',
    gtmEvent:    'Lead (Web)',
    formName:    'LP',

    voiceflow: {
      projectID:  '69ef9e6aeb124b8558d85864',
      versionID:  'production',
      wsUrl:      'wss://voiceflow-ddx3.onrender.com/',
      stylesheet: 'data:text/css;charset=utf-8,%0A.f6dof81%20%7B%0A%20%20height%3A%2055px%3B%0A%20%20min-width%3A%2055px%3B%0A%20%20width%3A%2055px%3B%0A%7D%0A%0A.f6dof8u%20%7B%0A%20%20height%3A%2060px%3B%0A%20%20width%3A%2060px%3B%0A%7D%0A%0A._1u16jolu%20%7B%0A%20%20height%3A%2055px%3B%0A%20%20width%3A%2055px%3B%0A%7D',
    },
  },

  // ── Exceções por página ──────────────────────────────────────
  // Páginas não listadas usam client.* automaticamente
  pages: {

    // Exemplo — descomentar e ajustar conforme necessário:
    // '/lp-promotores/': {
    //   formName:    'LP Promotores',
    //   webhookUrl:  'https://hook.eu1.make.com/outro-cenario',
    //   redirectUrl: 'https://api.whatsapp.com/send?phone=55...&text=...',
    // },

    // Redirect dinâmico baseado no valor de um campo do form:
    // '/lp-pdv/': {
    //   formName: 'LP PDV',
    //   getRedirectUrl: function(fields) {
    //     var rotas = {
    //       'varejo':  'https://wa.me/5511999990001?text=Varejo',
    //       'atacado': 'https://wa.me/5511999990002?text=Atacado',
    //     };
    //     return rotas[fields.segmento] || SCRIPTS_CONFIG.client.redirectUrl;
    //   },
    // },

  },

};

// ═══════════════════════════════════════════════════════════════
//  Não editar abaixo desta linha
// ═══════════════════════════════════════════════════════════════

(function () {

  // Resolve config da página atual mesclando com client.*
  function getPageConfig() {
    var pathname     = window.location.pathname;
    var pageOverride = SCRIPTS_CONFIG.pages[pathname] || {};
    return Object.assign({}, SCRIPTS_CONFIG.client, pageOverride);
  }

  var cfg = getPageConfig();


  /* ─────────────────────────────────────────────
     1. TRACKING INIT
     uuid, multi-touch attribution, IP, fbp
  ───────────────────────────────────────────── */
  (function initTracking() {
    var page_url = window.location.href;
    localStorage.setItem('page_url', page_url);

    if (!localStorage.getItem('uuid')) {
      localStorage.setItem('uuid', crypto.randomUUID());
    }

    if (page_url.includes('?')) {
      if (!localStorage.getItem('first_touch')) localStorage.setItem('first_touch', page_url);
      var previousLast = localStorage.getItem('last_touch');
      if (previousLast) localStorage.setItem('mid_touch', previousLast);
      localStorage.setItem('last_touch', page_url);
    }

    localStorage.setItem('client_agent', navigator.userAgent);

    fetch('https://api.ipify.org?format=json')
      .then(function (res) { return res.json(); })
      .then(function (data) { localStorage.setItem('ip_address', data.ip); })
      .catch(function () {});

    function getCookie(name) {
      var value = '; ' + document.cookie;
      var parts = value.split('; ' + name + '=');
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
    var fbp = getCookie('_fbp');
    if (fbp) localStorage.setItem('fbp', fbp);
  })();


  /* ─────────────────────────────────────────────
     4. FORM SUBMIT
     Valida → payload → webhook → dataLayer → redirect
  ───────────────────────────────────────────── */
  (function initForm() {
    var form = document.getElementById('lead-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Validação via Validation.validate() do validation.js
      if (window.Validation && !window.Validation.validate()) return;

      // Anti-duplo-envio
      if (this._sending) return;
      this._sending = true;

      var btn = document.getElementById('submit-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

      // Captura todos os campos do form
      var formData = Object.fromEntries(new FormData(form));

      // Payload
      var getLS     = function (k) { return localStorage.getItem(k) || ''; };
      var urlParams = new URLSearchParams(window.location.search);
      var payload   = {
        name:         formData.name        || '',
        email:        formData.email       || '',
        phone:        formData.phone       || '',
        form:         cfg.formName,
        page_url:     window.location.href,
        first_touch:  getLS('first_touch'),
        mid_touch:    getLS('mid_touch'),
        last_touch:   getLS('last_touch'),
        uuid:         getLS('uuid'),
        client_agent: getLS('client_agent') || navigator.userAgent,
        ip_address:   getLS('ip_address'),
        fbp:          getLS('fbp'),
        timestamp:    new Date().toISOString(),
      };

      ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'].forEach(function (utm) {
        var v = urlParams.get(utm);
        if (v) payload[utm] = v;
      });

      // Webhook
      var webhookUrl = cfg.webhookUrl;
      if (webhookUrl) {
        try {
          var ctrl = new AbortController();
          var t    = setTimeout(function () { ctrl.abort(); }, 3500);
          await fetch(webhookUrl, {
            method:    'POST',
            headers:   { 'Content-Type': 'application/json' },
            body:      JSON.stringify(payload),
            signal:    ctrl.signal,
            keepalive: true,
          });
          clearTimeout(t);
        } catch (err) {
          try {
            if (navigator.sendBeacon) {
              navigator.sendBeacon(webhookUrl, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
            }
          } catch (_) {}
        }
      }

      // dataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: cfg.gtmEvent }, payload));

      // Redirect — dinâmico se getRedirectUrl definido, senão usa redirectUrl
      await new Promise(function (r) { setTimeout(r, 250); });
      var redirectUrl = typeof cfg.getRedirectUrl === 'function'
        ? cfg.getRedirectUrl(formData)
        : cfg.redirectUrl;
      if (redirectUrl) window.location.assign(redirectUrl);
    });
  })();


  /* ─────────────────────────────────────────────
     5. VOICEFLOW + WEBSOCKET
     Carregamento preguiçoso — 5s ou primeira interação
  ───────────────────────────────────────────── */
  (function initVoiceflow() {
    var vf = cfg.voiceflow;
    if (!vf || !vf.projectID) return;

    // UUID do cliente para o Voiceflow
    if (!localStorage.getItem('client_uuid')) {
      localStorage.setItem('client_uuid', crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          })
      );
    }
    var clientUUID    = localStorage.getItem('client_uuid');
    window.clientUUID = clientUUID;

    // WebSocket — replica eventos para o dataLayer
    var wsSocket = new WebSocket(vf.wsUrl);

    wsSocket.onopen = function () {
      wsSocket.send(JSON.stringify({ type: 'identify', clientUUID: clientUUID }));
    };

    wsSocket.onmessage = function (event) {
      try {
        var data = JSON.parse(event.data);
        if (data.clientUUID === clientUUID && data.event) {
          var dataLayerEvent = { event: data.event };
          Object.keys(data).forEach(function (key) {
            if (key !== 'event') dataLayerEvent[key] = data[key];
          });
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(dataLayerEvent);
        }
      } catch (error) {
        console.error('Erro WebSocket:', error);
      }
    };

    wsSocket.onerror = function (error) {
      console.error('Erro no WebSocket:', error);
    };

    wsSocket.onclose = function () {
      console.log('WebSocket encerrado');
    };

    // Widget Voiceflow — carregamento preguiçoso
    var voiceflowLoaded = false;

    function loadVoiceflow() {
      if (voiceflowLoaded) return;
      voiceflowLoaded = true;

      var v  = document.createElement('script');
      v.type = 'text/javascript';
      v.src  = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';

      v.onload = function () {
        window.voiceflow.chat.load({
          verify:    { projectID: vf.projectID },
          url:       'https://general-runtime.voiceflow.com',
          versionID: vf.versionID || 'production',
          voice:     { url: 'https://runtime-api.voiceflow.com' },
          assistant: { stylesheet: vf.stylesheet },
          launch: {
            event: {
              type:    'launch',
              payload: {
                websiteURL: window.location.href,
                clientUUID: window.clientUUID,
              },
            },
          },
        }).then(function () {
          window.voiceflow.chat.proactive.clear();
        });
      };

      document.body.appendChild(v);
    }

    setTimeout(loadVoiceflow, 5000);
    ['click', 'touchstart', 'scroll'].forEach(function (e) {
      document.addEventListener(e, loadVoiceflow, { once: true, passive: true });
    });
  })();

})();
