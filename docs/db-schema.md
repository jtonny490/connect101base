# Database Schema

## Users

users

* id
* name
* email
* public_key
* trust_score
* created_at

## Deals

deals

* id
* freelancer_id
* client_id
* title
* description
* amount
* status
* created_at

Status Values:

* pending
* funded
* active
* completed
* disputed

## Payments

payments

* id
* deal_id
* invoice_id
* amount
* status
* payment_hash
* created_at

## Reviews

reviews

* id
* deal_id
* rating
* comment
* reviewer_id
* created_at

## CV Entries

cv_entries

* id
* user_id
* project_title
* amount
* rating
* verification_hash
* completed_at

## Reputation Metrics

reputation_metrics

* id
* user_id
* projects_completed
* average_rating
* dispute_rate
* repeat_client_rate
* total_verified_volume
