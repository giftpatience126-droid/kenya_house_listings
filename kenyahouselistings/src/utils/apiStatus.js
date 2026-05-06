import { API_ENDPOINTS, post } from './api';

export const checkApiStatus = async () => {
  const status = {
    overall: 'unknown',
    endpoints: {},
    timestamp: new Date().toISOString()
  };

  const endpoints = [
    { name: 'signin', url: API_ENDPOINTS.signin, method: 'POST' },
    { name: 'signup', url: API_ENDPOINTS.signup, method: 'POST' },
    { name: 'addproducts', url: API_ENDPOINTS.addproducts, method: 'POST' },
    { name: 'mpesaPayment', url: API_ENDPOINTS.mpesaPayment, method: 'POST' },
    { name: 'premiumPayment', url: API_ENDPOINTS.premiumPayment, method: 'POST' },
    { name: 'verifyListingPayment', url: API_ENDPOINTS.verifyListingPayment, method: 'POST' },
    { name: 'verifyPremiumPayment', url: API_ENDPOINTS.verifyPremiumPayment, method: 'POST' },
    { name: 'cart', url: API_ENDPOINTS.cart, method: 'POST' },
    { name: 'reservations', url: API_ENDPOINTS.reservations, method: 'POST' }
  ];

  let workingCount = 0;
  let totalCount = endpoints.length;

  for (const endpoint of endpoints) {
    try {
      // Try a simple ping to check if endpoint exists
      const response = await fetch(endpoint.url, {
        method: 'HEAD',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      status.endpoints[endpoint.name] = {
        status: response.ok ? 'working' : 'error',
        statusCode: response.status,
        url: endpoint.url
      };

      if (response.ok) {
        workingCount++;
      }
    } catch (error) {
      status.endpoints[endpoint.name] = {
        status: 'unreachable',
        error: error.message,
        url: endpoint.url
      };
    }
  }

  status.overall = workingCount === totalCount ? 'all_working' : 
                   workingCount > 0 ? 'partial' : 'none_working';
  status.workingCount = workingCount;
  status.totalCount = totalCount;

  return status;
};

export const getApiHealthMessage = (status) => {
  const { overall, workingCount, totalCount } = status;

  switch (overall) {
    case 'all_working':
      return '✅ All APIs are working properly';
    case 'partial':
      return `⚠️ ${workingCount}/${totalCount} APIs working. Some features may be limited`;
    case 'none_working':
      return '❌ No APIs are reachable. Using local fallbacks only';
    default:
      return '🔍 Checking API status...';
  }
};

export const testPaymentFlow = async () => {
  const testResults = {
    mpesaPayment: false,
    premiumPayment: false,
    cartSync: false,
    reservationSync: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Test M-Pesa payment
    const { mpesaPaymentApi } = await import('./api');
    await mpesaPaymentApi({
      phone: '254700000000',
      amount: '30',
      email: 'test@example.com',
      account_reference: 'Test',
      transaction_desc: 'Test payment'
    });
    testResults.mpesaPayment = true;
  } catch (error) {
    console.log('M-Pesa payment test failed:', error.message);
  }

  try {
    // Test premium payment
    const { premiumPaymentApi } = await import('./api');
    await premiumPaymentApi({
      phone: '254700000000',
      amount: '100',
      email: 'test@example.com'
    });
    testResults.premiumPayment = true;
  } catch (error) {
    console.log('Premium payment test failed:', error.message);
  }

  try {
    // Test cart sync
    const { saveCartApi } = await import('./api');
    await saveCartApi({
      buyerEmail: 'test@example.com',
      buyerName: 'Test User',
      items: [{ id: 1, title: 'Test Item', price: 1000 }]
    });
    testResults.cartSync = true;
  } catch (error) {
    console.log('Cart sync test failed:', error.message);
  }

  try {
    // Test reservation sync
    const { createReservationApi } = await import('./api');
    await createReservationApi({
      buyerName: 'Test User',
      buyerEmail: 'test@example.com',
      buyerPhone: '254700000000',
      guests: 2,
      reservationDate: '2024-01-01',
      paymentMethod: 'mpesa',
      amount: 1000,
      items: [{ id: 1, title: 'Test Item', price: 1000 }]
    });
    testResults.reservationSync = true;
  } catch (error) {
    console.log('Reservation sync test failed:', error.message);
  }

  return testResults;
};
