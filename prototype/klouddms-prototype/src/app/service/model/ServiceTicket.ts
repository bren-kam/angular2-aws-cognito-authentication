/**
 * FutureDMS API
 * Premier Enterprise Dealership Management System
 *
 * OpenAPI spec version: 0.3.1
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

import * as models from './models';

export interface ServiceTicket {
    /**
     * Unique identifier representing a specific service ticket
     */
    id?: string;

    /**
     * The customer reported complaint that initiated this service ticket.
     */
    complaint?: string;

    /**
     * The current status of a service ticket corresponding to workflow state.
     */
    status?: string;

}
