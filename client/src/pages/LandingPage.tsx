import { signInWithRedirect } from "aws-amplify/auth";
import { Button } from "../components/ui/button";
import {
  Heart,
  Users,
  Calendar,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export function LandingPage() {
  const handleSignIn = async () => {
    try {
      await signInWithRedirect();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Comprehensive Care Management",
      description:
        "Efficiently manage clients, volunteers, and healthcare professionals in one integrated platform.",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Smart Scheduling & Logging",
      description:
        "Track appointments, log activities, and maintain detailed records with our intuitive system.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Compliant",
      description:
        "Built with healthcare compliance in mind, ensuring your data is safe and secure.",
    },
  ];

  const benefits = [
    "Streamlined client onboarding and management",
    "Real-time activity tracking and reporting",
    "Automated DBS and training expiry monitoring",
    "Role-based access control for different staff levels",
    "Comprehensive audit trails for compliance",
    "Mobile-friendly interface for on-the-go access",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Paddock Health
              </span>
            </div>
            <Button onClick={handleSignIn} size="sm" className="shadow-lg">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100/80 text-blue-700 text-sm font-medium mb-8">
              <Shield className="h-4 w-4 mr-2" />
              Trusted Healthcare Management Platform
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Empowering Care
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Through Technology
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Streamline your healthcare operations with our comprehensive
              platform designed specifically for care organizations. Manage
              clients, volunteers, and staff efficiently while maintaining the
              highest standards of care and compliance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleSignIn}
                size="lg"
                className="shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white/60 backdrop-blur-sm py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for
                <span className="text-blue-600"> Exceptional Care</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our platform provides comprehensive tools to manage every aspect
                of your care organization.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50"
                >
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Why Choose
                  <span className="text-blue-600"> Paddock Health?</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Built by healthcare professionals for healthcare
                  professionals, our platform addresses the real challenges
                  faced by care organizations every day.
                </p>

                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white">
                  <div className="space-y-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Client Overview</h4>
                        <span className="bg-white/30 px-3 py-1 rounded-full text-xs">
                          Live
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white/20 h-3 rounded-full"></div>
                        <div className="bg-white/20 h-3 rounded-full w-3/4"></div>
                        <div className="bg-white/20 h-3 rounded-full w-1/2"></div>
                      </div>
                    </div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
                      <h4 className="font-semibold mb-4">Activity Summary</h4>
                      <div className="flex space-x-4">
                        <div className="bg-white/30 px-4 py-2 rounded-lg flex-1 text-center">
                          <div className="text-2xl font-bold">24</div>
                          <div className="text-sm opacity-90">
                            Active Clients
                          </div>
                        </div>
                        <div className="bg-white/30 px-4 py-2 rounded-lg flex-1 text-center">
                          <div className="text-2xl font-bold">12</div>
                          <div className="text-sm opacity-90">Volunteers</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Care Operations?
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              Join healthcare organizations already using Paddock Health to
              deliver better care.
            </p>
            <Button
              onClick={handleSignIn}
              size="lg"
              variant="secondary"
              className="shadow-2xl hover:shadow-2xl transition-all duration-300 bg-white text-blue-600 hover:bg-gray-50"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Paddock Health</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Paddock Health. Empowering care through technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
