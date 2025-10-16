// frontend/src/pages/TermsOfService.jsx

import React from 'react';
import '../styles/TermsOfService.css';

const TermsOfService = () => {
    return (
        <div className="page-content terms-page">
            <h1>Terms of Service</h1>
            <p className="page-subtitle">Welcome to ilkonbirkur.com. Please read these terms carefully before using our site.</p>

            <section>
                <h2>1. Acceptance</h2>
                <p>By visiting or using the ilkonbirkur.com website, you agree to these Terms of Service and our Privacy Policy. If you do not agree to the terms, please do not use our site.</p>
            </section>

            <section>
                <h2>2. Description of Service</h2>
                <p>ilkonbirkur.com is a simulation and fantasy sports platform that allows users to create their own football teams, participate in simulated matches, and track their tournament history. All results and statistics presented are based on simulation and do not reflect real-life football matches.</p>
            </section>

            <section>
                <h2>3. User Obligations</h2>
                <ul>
                    <li>You may only create and use one account.</li>
                    <li>You are entirely responsible for the security of your account.</li>
                    <li>You may not share content on the site that is illegal, threatening, harassing, or defamatory.</li>
                    <li>You may not engage in cheating, exploit abuse, or actions intended to disrupt the site's functionality.</li>
                </ul>
            </section>

            <section>
                <h2>4. Intellectual Property Rights</h2>
                <p>All content on our site (software, design, texts, logos, etc.) belongs to ilkonbirkur.com and is protected by copyright. Unauthorized reproduction, distribution, or use of our content is prohibited.</p>
            </section>

            <section>
                <h2>5. Disclaimer of Liability</h2>
                <p>ilkonbirkur.com does not guarantee that the service will be uninterrupted, error-free, or secure. The simulation results on the platform are for entertainment purposes only and do not contain any financial or legal commitment.</p>
            </section>

            <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US')}</p>
        </div>
    );
};

export default TermsOfService;