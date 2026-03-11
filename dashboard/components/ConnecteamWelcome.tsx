'use client';

import React from 'react';
import { PrimaryButton, SecondaryButton, FeatureCard, StatCard, SectionHeader } from './ConnecteamUIKit';
import { 
  Bot, Brain, Zap, Shield, BarChart3, Users, 
  MessageSquare, Sparkles, ArrowRight, CheckCircle2
} from 'lucide-react';

export function ConnecteamWelcome({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-6 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                ✨ Powered by AI • Enterprise-grade Security
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
              Manage Your AI Bots in One App
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Streamline your operations, automate workflows, and supercharge productivity with intelligent AI agents.
              Everything you need in one beautiful, unified platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PrimaryButton size="lg" onClick={onGetStarted}>
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </PrimaryButton>
              <SecondaryButton size="lg">
                View Demo
              </SecondaryButton>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-8 sm:p-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Active Bots', value: '24' },
                  { label: 'Conversations', value: '1.2K' },
                  { label: 'Automation Rate', value: '94%' },
                  { label: 'Uptime', value: '99.9%' },
                ].map((stat) => (
                  <div key={stat.label} className="text-white">
                    <p className="text-sm opacity-90 mb-1">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="Everything You Need"
            description="All the powerful features to manage, monitor, and optimize your AI agents"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Brain}
              title="AI Agent Management"
              description="Create, deploy, and manage intelligent AI agents with no-code setup"
            />
            <FeatureCard
              icon={Zap}
              title="Instant Automations"
              description="Automate repetitive tasks and streamline complex workflows effortlessly"
            />
            <FeatureCard
              icon={MessageSquare}
              title="Conversation Hub"
              description="Monitor and analyze all customer interactions in real-time"
            />
            <FeatureCard
              icon={BarChart3}
              title="Advanced Analytics"
              description="Gain insights with comprehensive dashboards and detailed reporting"
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="Bank-level encryption and compliance with GDPR, SOC 2, and more"
            />
            <FeatureCard
              icon={Users}
              title="Team Collaboration"
              description="Work together seamlessly with role-based access and permissions"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Why Teams Choose Our Platform
              </h2>
              <ul className="space-y-4">
                {[
                  'Cut deployment time by 80% with our AI-powered setup wizard',
                  'Reduce operational costs with intelligent automation',
                  'Stay compliant with built-in audit logs and documentation',
                  'Get real-time visibility into all your AI operations',
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Users" value="50K+" />
              <StatCard label="Uptime" value="99.9%" />
              <StatCard label="Saved Daily" value="10M+" change={{ value: 15, isPositive: true }} />
              <StatCard label="Companies" value="5K+" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-slate-900/50 dark:to-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="Loved by Teams Worldwide"
            description="See what users are saying about their experience"
            className="text-center mb-12"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "This platform has completely transformed how we manage our customer interactions. The AI capabilities are unmatched.",
                author: "Sarah Johnson",
                role: "Operations Director",
                company: "TechCorp",
              },
              {
                quote: "The onboarding was seamless and our team was productive within hours. Best decision we made this year.",
                author: "Michael Chen",
                role: "CEO",
                company: "Growth Labs",
              },
              {
                quote: "The support team is incredible, and the product keeps getting better. Highly recommend!",
                author: "Emily Rodriguez",
                role: "Team Lead",
                company: "CloudFirst",
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="card-elevated">
                <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of teams that are already using our platform to automate their workflows and delight their customers.
          </p>
          <PrimaryButton size="lg" onClick={onGetStarted}>
            Start Your Free Trial Today
          </PrimaryButton>
          <p className="text-sm text-muted-foreground mt-4">
            14 days free • No credit card required • Full access to all features
          </p>
        </div>
      </section>
    </div>
  );
}
