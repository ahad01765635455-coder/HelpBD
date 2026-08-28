package com.helpbd.admin

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var progress: ProgressBar

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFFF3F7F5.toInt())
        }

        val toolbar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(20, 14, 12, 14)
            setBackgroundColor(0xFF102D24.toInt())
        }

        val homeButton = Button(this).apply {
            text = "⌂ Admin Home"
            setTextColor(0xFFFFFFFF.toInt())
            setBackgroundColor(0x00102D24)
            setOnClickListener { webView.loadUrl(ADMIN_HOME_URL) }
        }
        toolbar.addView(homeButton, LinearLayout.LayoutParams(0, -2, 1f))

        progress = ProgressBar(this).apply { visibility = View.GONE }
        toolbar.addView(progress, LinearLayout.LayoutParams(-2, -2))

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.setSupportMultipleWindows(false)
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val host = request.url.host ?: return true
                    return host != ALLOWED_HOST
                }

                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    progress.visibility = View.VISIBLE
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    progress.visibility = View.GONE
                }
            }
            webChromeClient = WebChromeClient()
        }

        root.addView(toolbar, LinearLayout.LayoutParams(-1, -2))
        root.addView(webView, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(root)

        if (savedInstanceState == null) {
            webView.loadUrl(ADMIN_HOME_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    companion object {
        private const val ALLOWED_HOST = "help-bd.vercel.app"
        private const val ADMIN_HOME_URL = "https://help-bd.vercel.app/admin-home.html"
    }
}
