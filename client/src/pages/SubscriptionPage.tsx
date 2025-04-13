import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, useField } from 'formik';
import * as Yup from 'yup';

// Interface for subscription plans
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'annually';
  features: string[];
  recommended?: boolean;
}

// Custom form field component for better UX
const FormField = ({ label, ...props }: { label: string, name: string, [key: string]: any }) => {
  const [field, meta] = useField(props);
  return (
    <div className="form-group">
      <label htmlFor={props.id || props.name} className="form-label">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input className={`form-input ${meta.touched && meta.error ? 'border-red-500' : ''}`} {...field} {...props} />
      {meta.touched && meta.error ? (
        <div className="text-red-500 text-sm mt-1">{meta.error}</div>
      ) : null}
    </div>
  );
};

// Credit card formatter
const formatCreditCard = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts: string[] = [];
  
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  
  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
};

// Expiry date formatter (MM/YY)
const formatExpiryDate = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  
  if (v.length >= 3) {
    return `${v.substring(0, 2)}/${v.substring(2)}`;
  }
  
  return value;
};

const SubscriptionPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('professional-annual');
  const [paymentStep, setPaymentStep] = useState<'plan' | 'payment'>('plan');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cardType, setCardType] = useState<string>('unknown');

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  // Determine card type based on card number
  const detectCardType = (number: string) => {
    const re = {
      visa: /^4/,
      mastercard: /^(5[1-5]|2[2-7])/,
      amex: /^3[47]/,
      discover: /^(6011|65|64[4-9]|622)/,
    };
    
    if (re.visa.test(number)) return 'visa';
    if (re.mastercard.test(number)) return 'mastercard';
    if (re.amex.test(number)) return 'amex';
    if (re.discover.test(number)) return 'discover';
    return 'unknown';
  };

  // Subscription plans data
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic-monthly',
      name: 'Basic',
      price: 9.99,
      billingPeriod: 'monthly',
      features: [
        'Access to public studies',
        'Limited data recording',
        'Basic analytics',
        'Community support'
      ]
    },
    {
      id: 'basic-annual',
      name: 'Basic',
      price: 99.99,
      billingPeriod: 'annually',
      features: [
        'Access to public studies',
        'Limited data recording',
        'Basic analytics',
        'Community support',
        '2 months free'
      ]
    },
    {
      id: 'professional-monthly',
      name: 'Professional',
      price: 29.99,
      billingPeriod: 'monthly',
      features: [
        'Access to all studies',
        'Unlimited data recording',
        'Advanced analytics',
        'Priority support',
        'Export data in multiple formats',
        'Customizable dashboards'
      ]
    },
    {
      id: 'professional-annual',
      name: 'Professional',
      price: 299.99,
      billingPeriod: 'annually',
      recommended: true,
      features: [
        'Access to all studies',
        'Unlimited data recording',
        'Advanced analytics',
        'Priority support',
        'Export data in multiple formats',
        'Customizable dashboards',
        '2 months free'
      ]
    },
    {
      id: 'institution-monthly',
      name: 'Institution',
      price: 99.99,
      billingPeriod: 'monthly',
      features: [
        'Everything in Professional',
        'Multiple user accounts (up to 10)',
        'Team collaboration tools',
        'Admin dashboard',
        'API access',
        'Dedicated account manager',
        'Custom branding'
      ]
    },
    {
      id: 'institution-annual',
      name: 'Institution',
      price: 999.99,
      billingPeriod: 'annually',
      features: [
        'Everything in Professional',
        'Multiple user accounts (up to 10)',
        'Team collaboration tools',
        'Admin dashboard',
        'API access',
        'Dedicated account manager',
        'Custom branding',
        '2 months free'
      ]
    }
  ];

  // Payment validation schema
  const PaymentSchema = Yup.object().shape({
    cardName: Yup.string()
      .required('Cardholder name is required')
      .min(3, 'Name is too short'),
    cardNumber: Yup.string()
      .required('Card number is required')
      .test('is-credit-card', 'Card number is invalid', (value) => {
        if (!value) return false;
        // Remove spaces
        const cardNum = value.replace(/\s+/g, '');
        
        // Check if the number is 15-16 digits
        if (!/^\d{15,16}$/.test(cardNum)) return false;
        
        // Luhn algorithm for card validation
        let sum = 0;
        let double = false;
        
        // Loop from the right to left
        for (let i = cardNum.length - 1; i >= 0; i--) {
          let digit = parseInt(cardNum.charAt(i), 10);
          
          if (double) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          
          sum += digit;
          double = !double;
        }
        
        return sum % 10 === 0;
      }),
    expiryDate: Yup.string()
      .required('Expiry date is required')
      .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Expiry date must be in MM/YY format')
      .test('is-valid-expiry', 'Expiry date is invalid or expired', (value) => {
        if (!value) return false;
        
        const [month, year] = value.split('/');
        const expiry = new Date();
        expiry.setFullYear(2000 + parseInt(year, 10), parseInt(month, 10) - 1, 1);
        expiry.setMonth(expiry.getMonth() + 1, 0);
        
        return expiry > new Date();
      }),
    cvv: Yup.string()
      .required('CVV is required')
      .matches(/^[0-9]{3,4}$/, 'CVV must be 3 or 4 digits'),
    billingAddress: Yup.string()
      .required('Billing address is required')
      .min(5, 'Address is too short'),
    city: Yup.string()
      .required('City is required'),
    state: Yup.string()
      .required('State is required'),
    zipCode: Yup.string()
      .required('ZIP code is required')
      .matches(/^[0-9]{5}(-[0-9]{4})?$/, 'ZIP code must be in a valid format'),
    country: Yup.string()
      .required('Country is required'),
    agreeTerms: Yup.boolean()
      .oneOf([true], 'You must agree to the terms and conditions')
  });

  // Get selected plan details
  const selectedPlanDetails = subscriptionPlans.find(plan => plan.id === selectedPlan);

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  // Handle continue to payment
  const handleContinueToPayment = () => {
    if (selectedPlan) {
      setPaymentStep('payment');
      window.scrollTo(0, 0);
    }
  };

  // Handle back to plan selection
  const handleBackToPlan = () => {
    setPaymentStep('plan');
    setPaymentError(null);
    window.scrollTo(0, 0);
  };

  // Handle payment submission
  const handlePaymentSubmit = async (values: any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      setPaymentError(null);
      // In a real app, this would be an API call to process payment
      console.log('Processing payment:', values);
      console.log('Selected plan:', selectedPlanDetails);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success or failure (90% success rate)
      if (Math.random() > 0.1) {
        setPaymentSuccess(true);
        setSubmitting(false);
        window.scrollTo(0, 0);
      } else {
        throw new Error('Payment processing failed. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setSubmitting(false);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Subscription Plans</h1>
        <p className="text-gray-600">Choose the plan that best fits your research needs</p>
      </div>

      {paymentSuccess ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for subscribing to the {selectedPlanDetails?.name} plan. You now have access to all the features included in your subscription.
          </p>
          <p className="text-gray-600 mb-6">
            An email confirmation has been sent to your registered email address with all the details of your subscription.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary"
            aria-label="Go to Dashboard"
          >
            Go to Dashboard
          </button>
        </div>
      ) : paymentStep === 'plan' ? (
        <div>
          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-full inline-flex" role="radiogroup" aria-label="Billing Period">
              <button 
                className={`px-4 py-2 rounded-full ${selectedPlan.includes('monthly') ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                onClick={() => handlePlanSelect(selectedPlan.replace('annual', 'monthly'))}
                aria-pressed={selectedPlan.includes('monthly')}
                aria-label="Monthly billing"
              >
                Monthly
              </button>
              <button 
                className={`px-4 py-2 rounded-full ${selectedPlan.includes('annual') ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                onClick={() => handlePlanSelect(selectedPlan.replace('monthly', 'annual'))}
                aria-pressed={selectedPlan.includes('annual')}
                aria-label="Annual billing"
              >
                Annual <span className="text-xs font-normal">Save 17%</span>
              </button>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {['basic', 'professional', 'institution'].map(planType => {
              const plan = subscriptionPlans.find(p => p.id === `${planType}-${selectedPlan.includes('annual') ? 'annual' : 'monthly'}`);
              if (!plan) return null;
              
              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-lg overflow-hidden ${plan.recommended ? 'ring-2 ring-blue-500 shadow-lg' : 'border border-gray-200 shadow-md'}`}
                >
                  {plan.recommended && (
                    <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                      Recommended
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h2>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-600">/{plan.billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                    </div>
                    <ul className="space-y-2 mb-6" aria-label={`${plan.name} plan features`}>
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => {
                        handlePlanSelect(plan.id);
                        handleContinueToPayment();
                      }}
                      className={`w-full py-2 px-4 rounded-md font-medium ${
                        selectedPlan === plan.id 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                      aria-label={`Select ${plan.name} plan`}
                      aria-pressed={selectedPlan === plan.id}
                    >
                      {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <button
              onClick={handleContinueToPayment}
              className="btn-primary"
              aria-label="Continue to payment"
            >
              Continue to Payment
            </button>
          </div>

          {/* Additional Information */}
          <div className="mt-12 bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
            <div className="space-y-4 text-gray-700 text-sm">
              <p>All plans include:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access to the MyVetStudy platform</li>
                <li>Secure data storage</li>
                <li>Regular platform updates</li>
                <li>SSL encryption</li>
              </ul>
              <p>Annual plans are billed once per year. Monthly plans are billed every month.</p>
              <p>You can upgrade, downgrade, or cancel your subscription at any time.</p>
              <p>By subscribing, you agree to our <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            {paymentError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{paymentError}</span>
              </div>
            )}
            
            <div className="mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Order Summary</h2>
              <p className="text-gray-600">
                {selectedPlanDetails?.name} Plan ({selectedPlanDetails?.billingPeriod === 'monthly' ? 'Monthly' : 'Annual'})
              </p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600">Subscription Price</span>
                <span className="font-medium">${selectedPlanDetails?.price}</span>
              </div>
              <div className="flex justify-between items-center mt-2 text-lg font-bold">
                <span>Total</span>
                <span>${selectedPlanDetails?.price}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500 text-right">
                {selectedPlanDetails?.billingPeriod === 'monthly' 
                  ? 'Billed monthly'
                  : 'Billed annually'}
              </div>
            </div>

            <Formik
              initialValues={{
                cardName: '',
                cardNumber: '',
                expiryDate: '',
                cvv: '',
                billingAddress: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'US',
                agreeTerms: false
              }}
              validationSchema={PaymentSchema}
              onSubmit={handlePaymentSubmit}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className={`p-2 border rounded ${cardType === 'visa' ? 'border-blue-500' : 'border-gray-200'}`}>
                      <span className="font-medium text-sm">Visa</span>
                    </div>
                    <div className={`p-2 border rounded ${cardType === 'mastercard' ? 'border-blue-500' : 'border-gray-200'}`}>
                      <span className="font-medium text-sm">Mastercard</span>
                    </div>
                    <div className={`p-2 border rounded ${cardType === 'amex' ? 'border-blue-500' : 'border-gray-200'}`}>
                      <span className="font-medium text-sm">American Express</span>
                    </div>
                    <div className={`p-2 border rounded ${cardType === 'discover' ? 'border-blue-500' : 'border-gray-200'}`}>
                      <span className="font-medium text-sm">Discover</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {/* Card Information */}
                    <div className="space-y-4">
                      <FormField
                        label="Cardholder Name"
                        id="cardName"
                        name="cardName"
                        type="text"
                        placeholder="John Doe"
                        required
                      />
                      
                      <div className="form-group">
                        <label htmlFor="cardNumber" className="form-label">
                          Card Number <span className="text-red-500">*</span>
                        </label>
                        <Field name="cardNumber">
                          {({ field }: any) => (
                            <input
                              {...field}
                              id="cardNumber"
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              className="form-input"
                              value={formatCreditCard(field.value)}
                              onChange={(e) => {
                                const formattedValue = formatCreditCard(e.target.value);
                                setFieldValue('cardNumber', formattedValue);
                                
                                // Detect card type
                                const cardNumber = formattedValue.replace(/\s+/g, '');
                                if (cardNumber.length >= 4) {
                                  setCardType(detectCardType(cardNumber));
                                } else {
                                  setCardType('unknown');
                                }
                              }}
                              maxLength={19}
                            />
                          )}
                        </Field>
                        <ErrorMessage name="cardNumber" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label htmlFor="expiryDate" className="form-label">
                            Expiry Date <span className="text-red-500">*</span>
                          </label>
                          <Field name="expiryDate">
                            {({ field }: any) => (
                              <input
                                {...field}
                                id="expiryDate"
                                type="text"
                                placeholder="MM/YY"
                                className="form-input"
                                value={field.value}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/[^\d]/g, '');
                                  if (value.length > 0) {
                                    if (value.length <= 2) {
                                      setFieldValue('expiryDate', value);
                                    } else {
                                      setFieldValue('expiryDate', `${value.substring(0, 2)}/${value.substring(2, 4)}`);
                                    }
                                  } else {
                                    setFieldValue('expiryDate', '');
                                  }
                                }}
                                maxLength={5}
                              />
                            )}
                          </Field>
                          <ErrorMessage name="expiryDate" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <FormField
                          label="CVV"
                          id="cvv"
                          name="cvv"
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Billing Address */}
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Billing Address</h3>
                      
                      <div className="space-y-4">
                        <FormField
                          label="Address"
                          id="billingAddress"
                          name="billingAddress"
                          type="text"
                          placeholder="123 Main St"
                          required
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            label="City"
                            id="city"
                            name="city"
                            type="text"
                            placeholder="San Francisco"
                            required
                          />
                          
                          <FormField
                            label="State/Province"
                            id="state"
                            name="state"
                            type="text"
                            placeholder="CA"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            label="ZIP/Postal Code"
                            id="zipCode"
                            name="zipCode"
                            type="text"
                            placeholder="94103"
                            required
                          />
                          
                          <div className="form-group">
                            <label htmlFor="country" className="form-label">
                              Country <span className="text-red-500">*</span>
                            </label>
                            <Field 
                              as="select"
                              id="country" 
                              name="country" 
                              className="form-input" 
                            >
                              <option value="US">United States</option>
                              <option value="CA">Canada</option>
                              <option value="UK">United Kingdom</option>
                              <option value="AU">Australia</option>
                              <option value="DE">Germany</option>
                              <option value="FR">France</option>
                              <option value="JP">Japan</option>
                              <option value="Other">Other</option>
                            </Field>
                            <ErrorMessage name="country" component="div" className="text-red-500 text-sm mt-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms and Conditions */}
                  <div className="form-group">
                    <div className="flex items-center">
                      <Field 
                        type="checkbox" 
                        id="agreeTerms" 
                        name="agreeTerms" 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="agreeTerms" className="ml-2 text-gray-700">
                        I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                      </label>
                    </div>
                    <ErrorMessage name="agreeTerms" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  {/* Submit Buttons */}
                  <div className="flex justify-between">
                    <button 
                      type="button"
                      onClick={handleBackToPlan}
                      className="btn-secondary"
                      aria-label="Back to plans"
                    >
                      Back to Plans
                    </button>
                    
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={isSubmitting}
                      aria-label={`Pay $${selectedPlanDetails?.price}`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : `Pay $${selectedPlanDetails?.price}`}
                    </button>
                  </div>
                  
                  {/* Security Note */}
                  <div className="text-center text-gray-500 text-sm mt-4">
                    <div className="flex justify-center items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Secure payment processing
                    </div>
                    <p>Your payment information is encrypted and secure. We do not store your full credit card details.</p>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage; 