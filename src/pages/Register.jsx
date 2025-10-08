import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import emailjs from "emailjs-com";

import {
  CheckCircle,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import groupQR from "/images/group-q.png";
import secondQR from "/images/second-qr.jpg";

// SMTP Email Configuration - Add your Gmail accounts here
const SMTP_ACCOUNTS = [
  {
    email: "s210894@rguktsklm.ac.in",
    password: "gctb jrtf ryac gtga", // 16-char Gmail app password
  },
].filter(
  (acc) => acc.email && acc.password && acc.password !== "your-app-password-1"
);

let currentAccountIndex = 0;

const WHATSAPP_GROUP_LINK =
  "https://chat.whatsapp.com/IOa3y2QZaaCI1JCHCOmZIP?mode=ems_qr_t";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    institution: "",
    year: "",
    branch: "",
    experience: "",
    motivation: "",
    referralCode: "",
    attendanceMode: "",
    agreeTerms: false,
    agreeUpdates: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setFormData((prev) => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (user?.id) {
        try {
          const { data: existing } = await supabase
            .from("registrations")
            .select("*")
            .eq("user_id", user.id)
            .single();
          if (existing) setAlreadyRegistered(true);
        } catch (error) {
          console.error("Error checking registration:", error);
        }
      }
    };
    checkRegistration();
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "institution",
      "year",
      "branch",
      "attendanceMode",
    ];
    const missingFields = requiredFields.filter((f) => !formData[f]);
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.agreeTerms) {
      toast({
        title: "Terms & Conditions",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Function to send confirmation email

  const sendEmail = async (fullName, email) => {
    try {
      await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      console.log("✅ Email sent successfully");
    } catch (err) {
      console.error("❌ Failed to send email:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (!user) return;

      const referralCode = btoa(user.id).substring(0, 8);
      let referredBy = null;

      if (formData.referralCode) {
        const { data: referrer } = await supabase
          .from("registrations")
          .select("id")
          .eq("referral_code", formData.referralCode)
          .single();
        if (referrer) referredBy = referrer.id;
      }

      const { error } = await supabase.from("registrations").insert([
        {
          user_id: user.id,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          institution: formData.institution,
          year: formData.year,
          branch: formData.branch,
          experience: formData.experience,
          motivation: formData.motivation,
          referral_code: referralCode,
          referred_by: referredBy,
          attendance_mode: formData.attendanceMode,
        },
      ]);

      if (error) throw error;

      // Send confirmation email asynchronously (won't block user)
      sendEmail(formData.fullName, formData.email);

      setIsSubmitted(true);
      toast({
        title: "Registration Successful!",
        description:
          "You have registered for Qiskit Fall Fest 🎉 Check your email!",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Registration Failed",
        description: err.message || "Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Pages ---
  if (!user) {
    return (
      <motion.div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div className="max-w-md w-full text-center">
          <motion.div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-blue-600" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="mb-6">
            Please sign in to access the registration form.
          </p>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </motion.div>
      </motion.div>
    );
  }

  if (alreadyRegistered || isSubmitted) {
    return (
      <motion.div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div className="max-w-md w-full text-center">
          <motion.div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-4">Registration Successful!</h1>
          <p className="mb-6">
            Thanks for registering! Join our WhatsApp group:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <img
              src={groupQR}
              alt="WhatsApp QR"
              className="w-48 h-48 border rounded-lg"
            />
            <img
              src={secondQR}
              alt="Second QR"
              className="w-48 h-48 border rounded-lg"
            />
          </div>
          <Button
            onClick={() => window.open(WHATSAPP_GROUP_LINK, "_blank")}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Join WhatsApp Group
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Register for Qiskit Fall Fest 2025
            </h1>
            <p className="text-lg text-muted-foreground">
              Secure your spot at IIIT Srikakulam's quantum computing
              celebration
            </p>
          </div>
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                Registration Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    value={formData.referralCode}
                    onChange={(e) =>
                      handleInputChange("referralCode", e.target.value)
                    }
                    placeholder="Enter referral code if you have one"
                  />
                </div>
                {/* Academic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="institution">Institution *</Label>
                    <Input
                      id="institution"
                      value={formData.institution}
                      onChange={(e) =>
                        handleInputChange("institution", e.target.value)
                      }
                      placeholder="Your college/university name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Academic Year *</Label>
                    <Select
                      value={formData.year}
                      onValueChange={(value) =>
                        handleInputChange("year", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="E1">E1</SelectItem>
                        <SelectItem value="E2">E2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="branch">Branch/Major *</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) =>
                        handleInputChange("branch", e.target.value)
                      }
                      placeholder="e.g., Computer Science, Physics"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="attendanceMode">Attendance Mode *</Label>
                    <Select
                      value={formData.attendanceMode}
                      onValueChange={(value) =>
                        handleInputChange("attendanceMode", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select attendance mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Background */}
                <div>
                  <Label htmlFor="experience">
                    Quantum Computing Experience
                  </Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) =>
                      handleInputChange("experience", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No prior experience</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="motivation">
                    Why do you want to attend? (Optional)
                  </Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) =>
                      handleInputChange("motivation", e.target.value)
                    }
                    placeholder="Tell us what motivates you..."
                    rows={3}
                  />
                </div>
                {/* Terms & Updates */}
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) =>
                        handleInputChange("agreeTerms", checked)
                      }
                    />
                    <div className="text-sm">
                      <Label htmlFor="agreeTerms" className="cursor-pointer">
                        I agree to the{" "}
                        <a
                          href="/code-of-conduct"
                          className="text-primary hover:underline"
                        >
                          Code of Conduct
                        </a>{" "}
                        and event terms and conditions. *
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeUpdates"
                      checked={formData.agreeUpdates}
                      onCheckedChange={(checked) =>
                        handleInputChange("agreeUpdates", checked)
                      }
                    />
                    <div className="text-sm">
                      <Label htmlFor="agreeUpdates" className="cursor-pointer">
                        I would like to receive updates about future quantum
                        events.
                      </Label>
                    </div>
                  </div>
                </div>
                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full btn-quantum py-3 text-lg font-semibold rounded-lg shadow-lg relative group animate-pulse-glow"
                  disabled={isSubmitting}
                >
                  <span className="relative z-10">
                    {isSubmitting ? "Registering..." : "Complete Registration"}
                  </span>
                </Button>
                {/* Already Registered */}
                <div className="text-center text-sm text-muted-foreground">
                  Already registered?{" "}
                  <a
                    href={WHATSAPP_GROUP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    Join WhatsApp Group
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Register;
