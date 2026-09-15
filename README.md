# 🛒 ShopSense - Retail Management Platform for Inventory Control and Sales Analytics

<p align="center">

**A Full-Stack E-Commerce Analytics Platform with AI-Powered Forecasting, Customer Intelligence, Recommendations, and Business Intelligence**

</p>

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-REST_API-000000?logo=express&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-ML_Service-009688?logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Scikit Learn](https://img.shields.io/badge/Scikit--Learn-ML-F7931E?logo=scikit-learn&logoColor=white)
![MLflow](https://img.shields.io/badge/MLflow-Model_Registry-0194E2?logo=mlflow&logoColor=white)

</p>

---

# 📖 Overview

**ShopSense** is a full-stack enterprise e-commerce analytics and intelligent business platform designed to transform transactional marketplace data into actionable business intelligence.

The platform combines:

- Modern web application development
- E-commerce transaction management
- Vendor and customer management
- Business intelligence dashboards
- Machine learning
- Customer segmentation
- Product recommendations
- Demand forecasting
- Inventory intelligence
- Role-based access control
- Automated notifications
- Model tracking and management using MLflow
- Performance and regression testing

ShopSense provides separate experiences for **Customers, Vendors, and Administrators**, while a dedicated **FastAPI Machine Learning Service** handles analytics and predictive intelligence.

The system is designed as an academic capstone and technical evaluation project demonstrating how a modern enterprise analytics platform can integrate full-stack development, databases, APIs, machine learning, and business intelligence into one solution.

---

# 🎯 Project Objectives

The main objectives of ShopSense are:

- Build a complete multi-role e-commerce platform.
- Provide customers with a seamless shopping experience.
- Provide vendors with tools to manage products, inventory, orders, and analytics.
- Provide administrators with centralized business intelligence.
- Analyze customer purchasing behavior.
- Segment customers using RFM-based intelligence.
- Generate personalized product recommendations.
- Forecast future inventory/product demand.
- Provide business-level revenue and transaction analytics.
- Maintain secure authentication and role-based authorization.
- Integrate machine learning into a production-style architecture.
- Track ML experiments and models using MLflow.
- Perform integration, regression, and performance testing.
- Package the platform for deployment and technical evaluation.

---

# ✨ Key Features

## 👤 Authentication & Authorization

- User registration
- Secure login
- JWT-based authentication
- Password hashing using BCrypt
- Protected routes
- Role-based access control
- Customer role
- Vendor role
- Administrator role
- Session/token validation

---

## 🛍️ Customer E-Commerce

Customers can:

- Browse products
- Search products
- Filter products
- View product details
- Add products to cart
- Update cart quantities
- Remove products from cart
- Manage wishlist
- Checkout products
- Select payment method
- Place orders
- View order history
- Track transactions
- View personalized recommendations
- Receive notifications
- Access customer analytics

---

## 🏪 Vendor Management

Vendors can:

- Manage vendor profile
- Add products
- Update products
- Manage product inventory
- View orders
- Manage order status
- Monitor sales
- View revenue analytics
- Analyze customer activity
- Access vendor dashboards
- Monitor inventory intelligence
- View forecasting insights

---

## 👨‍💼 Admin Management

Administrators can:

- Manage users
- Manage vendors
- Manage products
- Monitor orders
- Monitor transactions
- View business analytics
- View revenue metrics
- Monitor inventory
- Access forecasting
- View customer segmentation
- Analyze customer behavior
- Monitor recommendations
- Manage notifications
- Access executive BI dashboards

---

# 📊 Business Intelligence Dashboard

ShopSense provides advanced analytics and BI capabilities for business decision-making.

### Business Metrics

- Total Revenue
- Gross Merchandise Value (GMV)
- Total Orders
- Total Transactions
- Average Order Value
- Vendor Performance
- Product Performance
- Customer Activity
- Inventory Status
- Revenue Trends

### Analytics Views

- Revenue analytics
- Order analytics
- Vendor analytics
- Product analytics
- Customer analytics
- Inventory analytics
- Transaction analytics
- Executive reporting

---

# 🤖 Machine Learning & AI

ShopSense integrates a dedicated machine learning service built using **Python and FastAPI**.

The ML service provides intelligent analytics capabilities including:

### 📈 Demand Forecasting

Predicts future product/inventory demand using historical transaction information.

Forecasting can support:

- Inventory planning
- Stock management
- Demand estimation
- Replenishment decisions
- Vendor planning

---

### 👥 Customer Segmentation

ShopSense uses customer purchasing behavior to create meaningful customer segments.

RFM-based analysis considers:

- **Recency**
- **Frequency**
- **Monetary Value**

Example customer segments include:

- VIP / Champions
- Loyal Customers
- At Risk Customers
- New Customers
- Inactive Customers

These segments help businesses understand customer value and engagement.

---

### 🛍️ Product Recommendation Engine

The recommendation engine provides personalized product suggestions using available customer and product interaction data.

Recommendation capabilities can support:

- Personalized shopping
- Cross-selling
- Product discovery
- Customer engagement
- Sales improvement

---

### 📦 Inventory Intelligence

Inventory analytics help identify:

- Current stock conditions
- Product demand
- Stock movement
- Inventory trends
- Potential stock requirements

The inventory intelligence pipeline connects transactional data with forecasting and analytics.

---

# 🏗️ System Architecture

```text
                         ┌───────────────────────────┐
                         │       ShopSense UI         │
                         │ React + TypeScript + Vite  │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │      Express API Gateway  │
                         │       Node.js + Express   │
                         │          Port 5000        │
                         └─────────────┬─────────────┘
                                       │
                  ┌────────────────────┼────────────────────┐
                  │                    │                    │
                  ▼                    ▼                    ▼
        ┌─────────────────┐   ┌─────────────────┐  ┌─────────────────┐
        │ Authentication  │   │ E-Commerce APIs │  │ Analytics APIs  │
        │ JWT + BCrypt    │   │ Orders/Cart/etc │  │ BI & Reporting  │
        └─────────────────┘   └─────────────────┘  └─────────────────┘
                  │                    │                    │
                  └────────────────────┼────────────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │       MongoDB Atlas       │
                         │        Database           │
                         └───────────────────────────┘
                                       │
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │   FastAPI ML Service      │
                         │       Python 3.11         │
                         │         Port 8000          │
                         └─────────────┬─────────────┘
                                       │
               ┌───────────────────────┼──────────────────────┐
               │                       │                      │
               ▼                       ▼                      ▼
       ┌───────────────┐       ┌───────────────┐      ┌───────────────┐
       │ Forecasting   │       │ Segmentation  │      │ Recommendation│
       │     Model     │       │     RFM       │      │    Engine     │
       └───────────────┘       └───────────────┘      └───────────────┘
               │                       │                      │
               └───────────────────────┼──────────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │    MLflow      │
                              │ Model Tracking │
                              │ & Registry     │
                              └────────────────┘
