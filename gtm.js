/**
 * tradehub/gtm.js
 * Google Tag Manager — TradeHub GPS
 *
 * Placement: Start of <head>
 * Carregado em: todas as LPs da TradeHub
 *
 * ─────────────────────────────────────────────
 *  CONFIGURAÇÃO — editar apenas aqui
 * ─────────────────────────────────────────────
 */

var GTM_ID = 'GTM-KKB3DS9M';

// ─────────────────────────────────────────────
//  Não editar abaixo desta linha
// ─────────────────────────────────────────────

// Snippet 1 — injeta no <head>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',GTM_ID);

// Snippet 2 — injeta noscript imediatamente após o <body>
document.addEventListener('DOMContentLoaded', function () {
  var ns = document.createElement('noscript');
  var iframe = document.createElement('iframe');
  iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + GTM_ID;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.cssText = 'display:none;visibility:hidden';
  ns.appendChild(iframe);
  document.body.insertBefore(ns, document.body.firstChild);
});
