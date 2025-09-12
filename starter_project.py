
def drift_function(policy_old, policy_new, epsilon, **kwargs):













    penalty = 0.0
    return penalty


def optimizer_step(params, grads, momentum, dormancy, layer_prop, batch_prop, train_prop, stochasticity, **kwargs):



















    new_params = params
    new_momentum = momentum
    return new_params, new_momentum


import jax.numpy as jnp

def log_clip_penalty_v2(policy_old, policy_new, advantage, epsilon):




    ratio = policy_new / (policy_old + 1e-8)
    clipped = jnp.clip(ratio, 1 - epsilon, 1 + epsilon)
    penalty = -jnp.log(clipped) * advantage
    return penalty