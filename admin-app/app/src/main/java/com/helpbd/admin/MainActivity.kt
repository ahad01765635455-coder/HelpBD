package com.helpbd.admin

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var errorView: LinearLayout

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
            setOnClickListener { loadAdminHome() }
        }
        toolbar.addView(homeButton, LinearLayout.LayoutParams(0, -2, 1f))

        progressBar = ProgressBar(this).apply { visibility = View.GONE }
        toolbar.addView(progressBar, LinearLayout.LayoutParams(-2, -2))

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.loadsImagesAutomatically = true
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.setSupportMultipleWindows(false)
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.userAgentString = settings.userAgentString + " HelpBD-Admin/1.0"
            setBackgroundColor(0xFFF3F7F5.toInt())

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val host = request.url.host?.lowercase() ?: return true
                    return !isAllowedHost(host)
                }

                @Deprecated("Deprecated in API 24")
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                    val host = try { android.net.Uri.parse(url).host?.lowercase() } catch (_: Exception) { null }
                    return host == null || !isAllowedHost(host)
                }

                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    errorView.visibility = View.GONE
                    webView.visibility = View.VISIBLE
                    progressBar.visibility = View.VISIBLE
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    progressBar.visibility = View.GONE
                }

                override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true) showError()
                }
            }
            webChromeClient = WebChromeClient()
        }

        errorView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(32, 32, 32, 32)
            visibility = View.GONE

            addView(TextView(this@MainActivity).apply {
                text = "HelpBD Admin লোড হচ্ছে না"
                textSize = 20f
                setTextColor(0xFF102D24.toInt())
                gravity = android.view.Gravity.CENTER
            }, LinearLayout.LayoutParams(-1, -2))

            addView(TextView(this@MainActivity).apply {
                text = "ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
                textSize = 15f
                setTextColor(0xFF5F7068.toInt())
                gravity = android.view.Gravity.CENTER
                setPadding(0, 12, 0, 20)
            }, LinearLayout.LayoutParams(-1, -2))

            addView(Button(this@MainActivity).apply {
                text = "🔄 আবার চেষ্টা করুন"
                setOnClickListener { loadAdminHome() }
            }, LinearLayout.LayoutParams(-2, -2))
        }

        root.addView(toolbar, LinearLayout.LayoutParams(-1, -2))
        root.addView(webView, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(errorView, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(root)

        if (savedInstanceState == null) {
            loadAdminHome()
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    private fun loadAdminHome() {
        errorView.visibility = View.GONE
        webView.visibility = View.VISIBLE
        progressBar.visibility = View.VISIBLE
        webView.loadUrl(ADMIN_HOME_URL)
    }

    private fun showError() {
        progressBar.visibility = View.GONE
        webView.visibility = View.GONE
        errorView.visibility = View.VISIBLE
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    companion object {
        private const val ADMIN_HOME_URL = "https://helpbd.devs.surf/admin-home.html"

        private fun isAllowedHost(host: String): Boolean =
            host == "helpbd.devs.surf" ||
            host == "www.helpbd.devs.surf" ||
            host == "help-bd.vercel.app" ||
            host.endsWith(".vercel.app")
    }
}
